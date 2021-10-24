const fs = require("fs");
const util = require('util');
const schedule = require("node-schedule");
const pageScraper = require('./scraping/pageScraper');
const _ = require('lodash');
const browserObject = require('./scraping/browser')
const slackbot = require('./slackbot')

let isRunning = false;
let apartmentData;

const writeFilePromisified = util.promisify(fs.writeFile)
const readFilePromisified = util.promisify(fs.readFile)

const scrapeAll = async (browserInstance) => {
  // init scraper object
  let browser;
  try{
        browser = await browserInstance;
       const result = await pageScraper.scraper(browser);
       // get previous data
      await getPreviousData(result)

      return result
    }
    catch(err){
        console.log("Could not resolve the browser instance => ", err);
    }
}

const updateApartmentList = async (aptData) => {
  console.log('Writing new data to file');
  const _apartmentData = {
    apartments: aptData
  }
  try {
    fs.writeFile("./src/apartmentData.json", JSON.stringify(_apartmentData), function(err){
      if(err) {
        return console.log("Couldn't write new data error: " + err);
      }
      else{
        console.log("file successfullt written");
      }
    });
  } catch (err) {
    console.log(err);
  }
}

const getPreviousData = async (aptData) => {
  try {
    // Load previous data from json file
    const data = await readFilePromisified("./src/apartmentData.json")
    apartmentData = await JSON.parse(data)
  } catch (err) {
    const _apartmentData = {
      apartments: aptData
    }
    // If file does not exist, write
    await writeFilePromisified("./src/apartmentData.json", JSON.stringify(_apartmentData))
  } 
}

const runChecks = async () => {
  try {
  let browserInstance = browserObject.startBrowser();
  const scrapeData = await scrapeAll(browserInstance)
  if(apartmentData !== undefined) {
    const newApartments = _.differenceWith(scrapeData, apartmentData.apartments, _.isEqual)
    if(newApartments.length !== 0) {
      console.log('Fond ' + newApartments.length + ' new apartment', newApartments.length > 1 ? 's' : '');
      console.log(newApartments);
      // Compare new apartments
      await compareApartments(newApartments)
      // write new apartments to file
      await updateApartmentList(scrapeData)
    } else {
      console.log('No new apartments');
    }
  } else {
    console.log('NO DATA TO COMPARE WITH');
  }
    isRunning = false;
  } catch (err) {
    console.log(err);
  }
}

const setupChecks = () => {
  try {
    // init cron job
  cron_schedule = "*/1 * * * *";
  const job = schedule.scheduleJob(cron_schedule, () => {
    if (isRunning) {
      console.log("Körs redan");
    } else {
      isRunning = true;
      timesRunned = job;
      runChecks();
    }
  });
} catch (err) {
  console.log(err);
}
}

  const compareApartments =  async (newApartments) => {
    // Compare new apartments agains checks and notify on slack if true
    try {
      await newApartments.forEach(apt => {
        if(apt.rent < 7000 && apt.kvm > 29) {
          slackbot.sendMessage(`
          Ny lägenhet ute hos Willhem, ${apt.address}, ${apt.info}, med månadshyra på ${apt.formattedRent}
          Se mer: ${apt.aptURL}
          `)
        }
    })

  } catch (err) {
    console.log(err);
  }
  }


module.exports.init = async () => {
  try {
  setupChecks()
} catch (err) {
  console.log(err);
}
}