const axios = require("axios"),
      URL   = require("url"),
      debug = require("debug")("rewriter"),
      ical  = require("icalendar"),
      csv   = require("csvtojson");

function fetch(url){
  return new Promise((resolve, reject) => {
    debug("fetching " + url);
    axios.get(url).then(response => {
      //Response was not the HTTP code for OK
      if(response.status != 200)
        return reject("[" + Date().toString() + "] Response not OK", url);

      resolve(response.data);
    }).catch(reject);
  });
}

function fetchICS(options){
  debug("fetching ics");
  return new Promise((resolve, reject) => {
    fetch(options.url.href).then(data => {
      resolve(Object.assign(options, {ics: data}));
    }).catch(reject);
  });
}

function fetchCSV(options){
  debug("fetching csv");
  return new Promise((resolve, reject) => {
    fetch(options.url.href.replace(".ics", ".csv")).then(data => {
      resolve(Object.assign(options, {csv: data}));
    }).catch(reject);
  });
}

function parseICS(options){
  debug("parsing ics");
  return Promise.resolve(Object.assign(options, {ics: ical.parse_calendar(options.ics)}));
}

function parseCSV(options){
  debug("parsing csv");
  return new Promise((resolve, reject) => {
    let parsed = [];
    csv({noheader:true}).fromString(options.csv)
    .on('json', result => {
      parsed.push(result);
    })
    .on('done', () => {
      //Remove first element - it contains no usable information
      parsed.shift();
      resolve(Object.assign(options, {csv: parsed}));
    });
  });
}

function getCourseCodes(options){
  //First element contains a field (field1) with course codes and matching description
  //Ex: "MA1446, Analys 2, MA1448 Linjär Algebra 1"
  let stringValues = options.csv.shift()["field1"];
  let courseCodes = {};
  
  while (stringValues.length > 0) {
    // Course codes are always 6 in length. /[A-Z]{2}[0-9]{4}/
    let courseCode = stringValues.substr(0, 6);
    // Course code is followed by ', '
    stringValues = stringValues.slice(6 + 2);
    let nextMatch = /([A-Z]{2}[0-9]{4})/.exec(stringValues);
    // If there are more course codes to be followed
    if (nextMatch != null) {
      // Course description is followed by ', ' - remove from description
      let courseDescription = stringValues.substr(0, nextMatch.index - 2);
      stringValues = stringValues.slice(nextMatch.index);
      courseCodes[courseCode] = courseDescription;
    } else {
      courseCodes[courseCode] = stringValues;
      stringValues = "";
    }
  }

  return Promise.resolve(Object.assign(options, {courseCodes: courseCodes}));
}

function getRules(options){
  debug("getting rules");

  //First element contains fields with corresponding values
  let fields = options.csv.shift();

  let rules = Object.keys(fields).reduce((result, field) => {
    if (fields[field] == "Startdatum")
      result.startDate = field;
    if (fields[field] == "Starttid")
      result.startTime = field;

    if (fields[field] == "Slutdatum")
      result.stopDate = field;
    if (fields[field] == "Sluttid")
      result.stopTime = field;

    if (fields[field] == "Kurs")
      result.course = field;

    if (fields[field] == "Person" || fields[field] == "Lärare")
      result.person = field;

    if (fields[field] == "Lokal")
      result.room = field;

    if (fields[field] == "Moment" || fields[field] == "Undervisningstyp")
      result.type = field;

    if (fields[field] == "Text")
      result.text = field;

    if (fields[field] == "Information till student")
      result.info = field;

    return result;
  }, {});

  return Promise.resolve(Object.assign(options, {rules: rules}));
}

function getEvents(options){
  debug("getting events");

  const { rules, csv } = options;

  let events = csv.reduce((result, event) => {
    result.push({
      start: new Date(event[rules.startDate] + "T" + event[rules.startTime] + ":00"),
      stop: new Date(event[rules.stopDate] + "T" + event[rules.stopTime] + ":00"),

      course: event[rules.course],

      person: event[rules.person],

      room: event[rules.room],

      type: event[rules.type],

      text: event[rules.text],

      info: event[rules.info]
    });
    return result;
  }, []);

  return Promise.resolve(Object.assign(options, {events: events}));
}

//Events available in the ics and csv formats are not aligned
function sortEvents(options){
  debug("sorting events");

  //Sort ical events by time, ascending
  let sortedEvents = options.ics.components.VEVENT.sort((a, b) => {
    return new Date(a.properties.DTSTART[0].value) - new Date(b.properties.DTSTART[0].value);
  });

  //Sort csv events by time, ascending
  options.events = options.events.sort((a, b) => {
    return a.start - b.start;
  });

  return Promise.resolve(Object.assign(options, {sortedEvents: sortedEvents}));
}

function finalizeEvents(options){
  debug("finalizing events");

  //Remove all ical events before rewriting and adding them again
  options.ics.components.VEVENT = [];

  for (let i = 0; i < options.sortedEvents.length; i++) {
    let {
      course,
      type,
      person,
      info,
      text
    } = options.events[i];

    //Course is not available - debug
    if(!course)
     return reject("Course not available: " + options.events[i]);

    //Try to rewrite the course code using the mapped codes in options.codes
    let expression = new RegExp(Object.keys(options.courseCodes).join("|"), "g");
    let courseCode = course.match(expression);

    if (courseCode)
      options.sortedEvents[i].properties.SUMMARY[0].value = (type ? type + ": " : "") + (options.courseCodes[courseCode[0]] || course);
    else
      options.sortedEvents[i].properties.SUMMARY[0].value = (type ? type + ": " : "") + course;
    options.sortedEvents[i].properties.DESCRIPTION[0].value = (person ? "Lärare: " + person + "\n" : "") + (course ? "Kurs: " + course + "\n" : "") + (info ? "Info: " + info : "") + (text ? "Text:" + text : "");

    const groupRegex = /gr\.?([0-9]+)/gi;

    //Hard coded rewrites to opt out non-participating courses
    if (course && course.includes("FY1420")) {
      if (text && text.includes("DVACD16"))
        options.ics.components.VEVENT.push(options.sortedEvents[i]);
    } else if (course && course.includes("MA1446")) {
      if (text && text.includes("DVACD16"))
        options.ics.components.VEVENT.push(options.sortedEvents[i]);
    } else if (type && type.includes("Gruppövning")) {
      if (text && text.indexOf("DVACD16") != -1)
        options.ics.components.VEVENT.push(options.sortedEvents[i]);
    } else if (text && text.includes("räknestuga")){
      options.sortedEvents[i].properties.SUMMARY[0].value = "Räknestuga";
      options.ics.components.VEVENT.push(options.sortedEvents[i]);
    } else {
      options.ics.components.VEVENT.push(options.sortedEvents[i]);
    }
  }

  //Return final rendered ical
  return Promise.resolve(options.ics.toString());
}

function parseURL(options){
  debug("parsing url");

  return new Promise((resolve, reject) => {
    try {
     options.url = URL.parse(decodeURIComponent(options.url));
    } catch (e) {
      //Expected a valid se.timeedit.net URL
      reject("[" + Date().toString() + "] Non-valid URL: ", options.url);
    }
    resolve(options);
  });
}

function checkURL(options){
  debug("checking url");
  return new Promise((resolve, reject) => {
    if (!options.url.hostname == "se.timeedit.net" || !options.url.host == "se.timeedit.net")
     reject("[" + Date().toString() + "] Expected a se.timeedit.net URL, got: " + url);

    resolve(options);
  });
}

module.exports = {
  parseURL:       parseURL,
  checkURL:       checkURL,
  fetchICS:       fetchICS,
  parseICS:       parseICS,
  fetchCSV:       fetchCSV,
  parseCSV:       parseCSV,
  getCourseCodes: getCourseCodes,
  getRules:       getRules,
  getEvents:      getEvents,
  sortEvents:     sortEvents,
  finalizeEvents: finalizeEvents
};
