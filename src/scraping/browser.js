const puppeteer = require('puppeteer-extra')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin())

async function startBrowser() {
  let browser
  try {
    console.log('opening browser')
    browser = await puppeteer.launch({
      headless: true,
      args: ['--disable-setuid-sandbox'], 'ignoreHTTPSErrors' : true
    })
  } catch (err) {
    console.log('Could not create browser instance:', err)
  }

  return browser
}

module.exports = {
  startBrowser
}