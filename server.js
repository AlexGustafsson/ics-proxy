const debug = require('debug')('server');
const express = require('express');

const app = express();

const {
  checkURL,
  parseURL,
  fetchICS,
  parseICS,
  fetchCSV,
  parseCSV,
  getCourseCodes,
  getRules,
  getEvents,
  sortEvents,
  finalizeEvents
} = require('./methods.js');

app.get('/', (req, res) => {
  debug('serving instructions');
  res.set('content-type', 'text/plain; charset=UTF-8');
  res.send(`
  1. Välj kurser m.m. på TimeEdit som vanligt.
  2. Klicka på 'Prenumerera'
  3. Kopiera länken
  4. Lägg till ett snedstreck efter den nuvarande URL:en och klistra in länken`);
});

app.get('*', (req, res) => {
  if (req.url.indexOf('.ico') !== -1)
    return res.status(404).send('Not found');

  // Make sure that the url is parsed in full
  if (req.url.indexOf('/') === 0)
    req.url = req.url.substr(1);

  parseURL({url: req.url})
  .then(checkURL)
  .then(fetchICS)
  .then(parseICS)
  .then(fetchCSV)
  .then(parseCSV)
  .then(getCourseCodes)
  .then(getRules)
  .then(getEvents)
  .then(sortEvents)
  .then(finalizeEvents)
  .then(ical => {
    debug('handling result');
    res.set('content-type', 'text/calendar; charset=UTF-8');
    res.set('content-disposition', 'attachment; filename="Schema"');
    res.send(ical);

    // Log school name
    debug(`served schedule for: ${req.url.split('/')[4]}`);
  })
  .catch(error => res.status(500).send(error));
});

app.listen(3000, () => {
  debug('started server');
});

// Handle unhandled rejections
process.on('unhandledRejection', reason => {
  debug('unhandled rejection due to: ' + reason);
});
