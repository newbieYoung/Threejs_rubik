'use strict';

const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone6 = devices['iPhone 6'];

(async () => {

	const browser = await puppeteer.launch({
        headless:false
    });
    const page = await browser.newPage();
    await page.emulate(iPhone6);
    await page.goto('https://newbieyoung.github.io/Threejs_rubik/step5.html');

    page.on('console', msg => {
    	console.log('PAGE LOG:', msg.text())
    });

    let rotateTime = 200;
    let randomNum = 10;

    let $randomRotate = await page.$('#randomRotate');
    $randomRotate.click();

    await sleep(rotateTime*randomNum*2);

    let $autoResetV1 = await page.$('#autoResetV1');
    $autoResetV1.click();

})();

function sleep(ms){
	return new Promise(resolve => setTimeout(resolve,ms));
}