/**
 * 统计分析日志文件
 */
'use strict';
let fs = require('fs');
let readline = require('readline');

let totalCaseNum = 0;//总样本数量
let totalStep = 0;//总步数
let totalTime = 0;//总时长
let averageStep = 0;//平均步数
let averageTime = 0;//平均时长

//逐行读取
let rs = fs.createReadStream('auto-reset-v1-log.txt');//输入流
let ws = fs.createWriteStream('auto-reset-v1-analyze.txt');//输出流
let rl = readline.createInterface({
    input: rs,
    output: ws
});

rl.on('line', function(line) {

	if(line == 'end autoResetV1'){
		totalCaseNum++;
		return;
	}
	
	let stepIndex = line.indexOf('total steps:');
	if(stepIndex!=-1){
		let itemStep = line.substring(stepIndex+12,line.length);
		totalStep += parseInt(itemStep);
		return;
	}

	let timeIndex = line.indexOf('total times:');
	if(timeIndex!=-1){
		let itemTime = line.substring(timeIndex+12,line.length);
		totalTime += parseFloat(itemTime)/1000;//防止超出范围
		return;
	}
});

rs.on('end', ()=>{
	let outputTxt = '';
	outputTxt += 'totalCaseNum : '+totalCaseNum+'\n';
	outputTxt += 'averageStep : '+totalStep/totalCaseNum+'\n';
	outputTxt += 'averageTime : '+totalTime/totalCaseNum+'\n';
	rl.output.write(outputTxt);
});
