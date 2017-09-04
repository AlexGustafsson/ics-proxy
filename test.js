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

const url = "https://se.timeedit.net/web/bth/db1/sched1/ri614Q9XX51ZY1Q5388939Q4y9ZY3Y5829Q9969QY07X7XY7Z752n204.ics";

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
