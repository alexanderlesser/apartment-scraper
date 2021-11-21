const retry = require('async-retry')

const scraperObject = {
  url: 'https://www.willhem.se/sok-bostad/Boras/',
  // url: 'http://books.toscrape.com',
  async scraper(browser){
     
      return await retry(
        async (bail) => {
          let page = await browser.newPage()
          console.log(`Navigating to ${this.url}...`)
          await page.goto(this.url, { waitUntil: 'load' })
    
          let data = await page.$$eval('.table > tbody > tr', tables => { 
            return tables.map(tr => {
              const address = tr.querySelector('[data-title="Adress"] p').innerText
              const rent = tr.querySelector('[data-title="Hyra"]').innerText
              const info = tr.querySelector('[data-title="Yta, antal rum"] p').innerText
              const aptURL = tr.querySelector('a').getAttribute('href')
              return {
                address: address,
                rent: rent,
                info: info,
                aptURL: 'https://www.willhem.se' + aptURL
              }
            })
          })
    
          const formattedData = await data.map(apartment => {
            const sRent = apartment.rent.match(/(\d+)/)[0]
            const nRent = parseInt(sRent)
            
            const sKVM = apartment.info.match(/(\d+)/)[0]
            const nKVM = parseInt(sKVM)
            const obj = {
              address: apartment.address,
              formattedRent: apartment.rent,
              rent: nRent,
              info: apartment.info,
              kvm: nKVM,
              aptURL: apartment.aptURL
            }
    
            return obj
    
          })
          await browser.close()
          return formattedData
         
        },
        {
          retries: 5,
          onRetry: (err, currentAttempt) => {
            console.log('Error when trying to fetch apartments, current attempt: ', currentAttempt)
            console.log(err)
          },
        }
      );
  }
}

module.exports = scraperObject