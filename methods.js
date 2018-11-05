const URL = require('url');
const crypto = require('crypto');

const axios = require('axios');
const debug = require('debug')('rewriter');
const ICS = require('ics');
const csv = require('csvtojson');

const ics = new ICS();

function fetch(url) {
  return new Promise((resolve, reject) => {
    debug('fetching ' + url);

    axios.get(url).then(response => {
      // Response was not the HTTP code for OK
      if (response.status !== 200)
        return reject(new Error(`Expected response to be 'OK', was '${response.status}'`, url));

      resolve(response.data);
    }).catch(reject);
  });
}

function fetchCSV(options) {
  debug('fetching csv');

  return new Promise((resolve, reject) => {
    fetch(options.url.href.replace('.ics', '.csv')).then(data => {
      resolve(Object.assign(options, {csv: data}));
    }).catch(reject);
  });
}

function parseCSV(options) {
  debug('parsing csv');

  return new Promise(resolve => {
    const parsed = [];
    csv({noheader: true}).fromString(options.csv)
    .on('json', result => {
      parsed.push(result);
    })
    .on('done', () => {
      // Remove first element - it contains no usable information
      parsed.shift();
      resolve(Object.assign(options, {csv: parsed}));
    });
  });
}

function getCourseCodes(options) {
  // First element contains a field (field1) with course codes and matching description
  // I.e: 'MA1446, Analys 2, MA1448 Linjär Algebra 1'
  let stringValues = options.csv.shift()['field1'];
  const courseCodes = {};

  while (stringValues.length > 0) {
    // Course codes are always 6 in length. /[A-Z]{2}[0-9]{4}/
    const courseCode = stringValues.substr(0, 6);
    // Course code is followed by ', '
    stringValues = stringValues.slice(6 + 2);
    const nextMatch = /([A-Z]{2}[0-9]{4})/.exec(stringValues);
    // If there are more course codes to be followed
    if (nextMatch === null) {
      courseCodes[courseCode] = stringValues;
      stringValues = '';
    } else {
      // Course description is followed by ', ' - remove from description
      const courseDescription = stringValues.substr(0, nextMatch.index - 2);
      stringValues = stringValues.slice(nextMatch.index);
      courseCodes[courseCode] = courseDescription;
    }
  }

  return Promise.resolve(Object.assign(options, {courseCodes}));
}

function getRules(options) {
  debug('getting rules');

  // First element contains fields with corresponding values
  const fields = options.csv.shift();

  const rules = Object.keys(fields).reduce((result, field) => {
    if (fields[field] === 'Startdatum')
      result.startDate = field;
    if (fields[field] === 'Starttid')
      result.startTime = field;

    if (fields[field] === 'Slutdatum')
      result.stopDate = field;
    if (fields[field] === 'Sluttid')
      result.stopTime = field;

    if (fields[field] === 'Kurs')
      result.course = field;

    if (fields[field] === 'Person' || fields[field] === 'Lärare')
      result.person = field;

    if (fields[field] === 'Lokal')
      result.room = field;

    if (fields[field] === 'Moment' || fields[field] === 'Undervisningstyp')
      result.type = field;

    if (fields[field] === 'Text')
      result.text = field;

    if (fields[field] === 'Information till student')
      result.info = field;

    return result;
  }, {});

  return Promise.resolve(Object.assign(options, {rules}));
}

function getEvents(options) {
  debug('getting events');

  const {rules, csv} = options;

  const events = csv.reduce((result, event) => {
    const course = event[rules.course];
    result.push({
      start: event[rules.startDate] + 'T' + event[rules.startTime] + ':00',
      stop: event[rules.stopDate] + 'T' + event[rules.stopTime] + ':00',

      // Course foramt: CODE. Description, extract only code
      course: options.courseCodes[course.split('.')[0]] || course,
      courseCode: event[rules.course],

      person: event[rules.person],

      room: event[rules.room],

      type: event[rules.type] || '',

      text: event[rules.text],

      info: event[rules.info]
    });
    return result;
  }, []);

  return Promise.resolve(Object.assign(options, {events}));
}

function filterEvents(options) {
  debug('filtering events');

  const filteredEvents = options.events.filter(event => {
    if (event.type === 'Gruppövning')
      return event.text.includes('DVACD16');
    return true;
  });

  return Promise.resolve(Object.assign(options, {events: filteredEvents}));
}

function formatTitle(event) {
  const type = event.type === '' ? 'Föreläsning' : event.type;
  let formattedTitle = `${type}: ${event.course}`;

  if (event.text && event.text.includes('räknestuga'))
    formattedTitle = 'Räknestuga';

  return formattedTitle;
}

function formatDescription(event) {
  const teacherString = event.person ? `Lärare: ${event.person}\\n` : '';
  const courseString = event.course ? `Kurs: ${event.course}\\n` : '';
  const infoString = event.info ? `Info: ${event.info}\\n` : '';
  const textString = event.text ? `Text: ${event.text}` : '';

  return (teacherString + courseString + infoString + textString).trim();
}

function hash(event) {
  // Make the hash (id) depend on the start and end date and the location
  const digest = crypto.createHash('md5').update(event.start + event.stop + event.room).digest('hex');
  return digest;
}

function formatEvent(event) {
  // Course is not available - debug
  if (!event.course) {
    Promise.reject(new Error(`Course is not available: ${JSON.stringify(event, null, 2)}`));
    return null;
  }

  const formattedEvent = {
    uid: hash(event),
    start: event.start,
    end: event.stop,
    title: formatTitle(event),
    description: formatDescription(event),
    location: event.room,
    url: null,
    status: null,
    categories: [event.course, event.type],
    alarms: []
  };

  // Remind the user one day before and 30 minutes before a laboration
  if (event.type === 'Laboration') {
    formattedEvent.alarms.push({action: 'DISPLAY', trigger: '-PT24H'});
    formattedEvent.alarms.push({action: 'DISPLAY', trigger: '-PT30M'});
  }

  return formattedEvent;
}

function finalizeEvent(event) {
  const formattedEvent = formatEvent(event);
  let eventString = ics.buildEvent(formattedEvent);
  const lines = eventString.split('\n');
  lines.splice(0, 4);
  lines.splice(-1);
  eventString = lines.join('\n');

  // Return final rendered event
  return eventString;
}

function finalizeEvents(options) {
  const finalizedEvents = options.events.map(finalizeEvent);

  const head =
`BEGIN:VCALENDAR
VERSION:2.0
METHOD:PUBLISH
X-WR-CALNAME:${options.school}
X-WR-CALDESC:Kalender för ${options.school}
X-PUBLISHED-TTL:PT20M
CALSCALE:GREGORIAN
PRODID:-//TimeEdit via Alex Gustafsson//TimeEdit - ICS-Proxy//EN\n`;

  const tail = `\nEND:VCALENDAR`;

  const renderedEvents = head + finalizedEvents.join('\n') + tail;

  return Promise.resolve(renderedEvents);
}

function parseURL(options) {
  debug('parsing url');

  return new Promise((resolve, reject) => {
    try {
      options.url = URL.parse(decodeURIComponent(options.url));
    } catch (error) {
      // Expected a valid se.timeedit.net URL
      reject(new Error(`Expected a correct URL, was: ${options.url}`));
    }
    resolve(options);
  });
}

function checkURL(options) {
  debug('checking url');
  return new Promise((resolve, reject) => {
    if (!options.url.hostname === 'se.timeedit.net' || !options.url.host === 'se.timeedit.net')
      reject(new Error(`Expected a se.timeedit.net URL, was: ${options.url}`));

    resolve(options);
  });
}

module.exports = {
  parseURL,
  checkURL,
  fetchCSV,
  parseCSV,
  getCourseCodes,
  getRules,
  getEvents,
  filterEvents,
  formatTitle,
  formatDescription,
  hash,
  formatEvent,
  finalizeEvent,
  finalizeEvents
};
