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

const url = "https://se.timeedit.net/web/bth/db1/sched1/ri627Q90X89ZY1Q5Yn807203yXZ55Y7QQ6Z9771Q9.ics";

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
