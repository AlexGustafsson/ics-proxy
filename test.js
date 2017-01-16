const {
  parseURL,
  checkURL,
  fetchICS,
  parseICS,
  fetchCSV,
  parseCSV,
  getCourseCodes,
  getRules,
  getEvents,
  sortEvents,
  finalizeEvents,
} = require("./methods.js");

const url = "https://se.timeedit.net/web/bth/db1/sched1/ri69nQXQX62Z9ZQ5Y9601755y2Z98Y7YQ729X12Q9673055Y.ics";

//TODO: execute actual tests here

parseURL({url: url})
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
.catch(error => console.log(error));
