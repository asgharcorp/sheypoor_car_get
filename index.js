const {Builder, Browser, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require("fs")
const cars = require("./Cars/cars.json");
const axios = require("axios").default;
const {promisify} = require('util');
const stream = require('stream');


let carsList = cars.cars;

function init() {
    for (let i = 0; i < carsList.length; i++) {
        if (!fs.existsSync(carsList[i].name) + "_dir") {
            fs.mkdirSync(carsList[i].name + "_dir");
        }
    }
}

async function run() {
    let total = 1;
    for (let i = 0; i < carsList.length; i++) {
        let driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(new chrome.Options().windowSize({
            width: 640,
            height: 480
        })).build();
        let cn = 1;
        for (let j = 1; j < 1000; j++) {
            await driver.get(carsList[i].url + "&p=" + j);
            let elements = await driver.findElements(By.tagName('article'));
            console.log(j);
            if (elements.length == 0) {
                break;
            } else {
                for (let k = 0; k < elements.length; k++) {
                    await fs.promises.appendFile(carsList[i].name, (await elements[k].getAttribute('data-href')) + "\n", 'utf-8');
                    console.clear();
                    console.log("get...")
                    console.log(carsList[i].name + ": ");
                    console.log("total: ", total);
                    console.log("car number: ", cn);
                    total++;
                    cn++;

                }
            }
        }
        driver.close();
    }

}

async function procImg() {
    let carNumber = 1;
    for (let i = 0; i < carsList.length; i++) {
        let fileData = await fs.promises.readFile(carsList[i].name);
        let carsUrl = fileData.toString().split('\n');
        let driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(new chrome.Options().windowSize({
            width: 640,
            height: 480
        })).build();
        for (let j = 0; j < carsUrl.length; j++) {
            await driver.get(carsUrl[j]);
            let carsImg = await driver.findElements(By.tagName("img"));
            for (let k = 0; k < carsImg.length; k++) {
                if (await carsImg[k].getAttribute('width') == '650') {
                    let src = (await carsImg[k].getAttribute('src'));
                    let dataSrc = await carsImg[k].getAttribute('data-srcset');
                    let url = '';
                    if (src != null) {
                        url = src;
                    } else if (dataSrc != '' || dataSrc != null) {
                        url = dataSrc;
                    } else {
                        url = await carsImg[k].getAttribute('srcset');
                    }
                    try {
                        const response = await axios({
                            method: "GET",
                            url: url,
                            responseType: "stream",
                        });

                        const finishedDownload = promisify(stream.finished);
                        const writer = fs.createWriteStream(carsList[i].name + "_dir/" + carsList[i].name + "_" + carNumber + ".jpg");
                        response.data.pipe(writer);
                        await finishedDownload(writer);
                        console.clear();
                        console.log("get...")
                        console.log(carsList[i].name);
                        console.log("car number: ", carNumber);
                        carNumber++;
                    } catch (err) {
                        console.log(err)
                    }

                }
            }
        }
        driver.close();
    }
}


run().then(() => {
    procImg();
});

