'use strict';

const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone6 = devices['iPhone 6'];
const fs = require('fs');

(async ()=>{
    const browser = await puppeteer.launch({
        headless:false
    });
    step(browser);
})();

async function step(browser){

    let logs = '';
    let page = await browser.newPage();
    await page.emulate(iPhone6);
    //await page.goto('https://newbieyoung.github.io/Threejs_rubik/step5.html');
    await page.goto('http://localhost:9000/step5.html');

    page.on('console', msg => {
        (async ()=>{
            var log = msg.text();
            console.log('PAGE LOG:', log);
            logs += log+'\n';
            if(log == 'end autoResetV1'||log == 'already reset'){
                fs.appendFileSync('auto-reset-v1-log.txt',logs);
                await page.close();
                step(browser);
            }
        })()
    });

    let rotateTime = 200;
    let randomNum = 20;

    let $randomRotate = await page.$('#randomRotate');
    $randomRotate.click();

    await sleep(rotateTime*randomNum*3);

    let $autoResetV1 = await page.$('#autoResetV1');
    $autoResetV1.click();
}

function sleep(ms){
	return new Promise(resolve => setTimeout(resolve,ms));
}