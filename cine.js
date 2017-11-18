// TVP stream downloader
/**
 * Requirements:
 * 
 * PHP (required for processing manifest files)
 * PHP extensions (examples with php 7.1):
 * 	bcmath (php7.1-bcmath)
 * 	curl (php7.1-curl)
 * 	SimpleXML (php7.1-xml)
 * 
 */


const process = require('process');
const fs = require('fs');
const readline = require('readline');
const slugify = require('slugify');
const Crawler = require('crawler');

require('colors'); // ;-)

const UA_STRINGS = require('./utils/ua-strings');

// const URL = 'http://www.tvpublica.com.ar/vivo/';
const URL = new Buffer('aHR0cDovL3d3dy50dnB1YmxpY2EuY29tLmFyL3Zpdm8v', 'base64').toString('ascii');

let c = new Crawler({
	rateLimit: Math.floor(Math.random() * 1000),
	maxConnections: 1,
	rotateUA: UA_STRINGS,
	callback: function (error, res, done) {
		if (error) {
			console.log(error);
			process.exit(1);
		} else {
			let $ = res.$;
			let lista = $('iframe').toArray();

			console.log('Búśćáńdó éń: ' + $('title').text());

			let videoURL = lista[0].attribs.src;
			if (videoURL) {
				console.log(`[OK] ==> URL found: ${videoURL}`);

				let v = new Crawler({
					rateLimit: Math.floor(Math.random() * 1000),
					maxConnections: 1,
					rotateUA: UA_STRINGS,
					referer: URL,
					callback: function (error, res, done) {
						if (error) {
							console.log(error);
							process.exit(1);
						} else {
							let $ = res.$;
							//let lista = $('iframe').toArray();

							// console.log('Búśćáńdó éń: ' + $('title').text());
							// console.log($('body').text());
							let rx = new RegExp(/atob\(\"(.*)\"\)/, 'gi');
							let a = $('body').text().match(rx);
							let streamURL = new Buffer(a[0].replace(/atob\(\"|\"\)/g, ''), 'base64').toString('ascii');
							console.log(`[OK] ==> Streams found: `);

							let streamData = JSON.parse(streamURL);

							console.log(`1: ${streamData.asset.publishPoints.hds}`);
							console.log(`2: ${streamData.asset.publishPoints.hls}`);

							const rl = readline.createInterface({
								input: process.stdin,
								output: process.stdout
							});

							rl.question('Stream to process: ', (answer) => {
								let stream = '';
								if (answer === '1') {
									stream = streamData.asset.publishPoints.hds;
								} else if (answer === '2') {
									stream = streamData.asset.publishPoints.hls;
								}

								downloadStream(stream, videoURL, 'streams');

								rl.close();
							});
						}
						done();
					}
				});
				v.queue(videoURL);

			}

		}
		done();
	}
});

c.queue(URL);

function downloadStream(streamURL, referer, destinationDir) {

	console.log(`Saving stream ${streamURL}`);

	const kill = require('tree-kill');
	const spawn = require('child_process').spawn;

	let downloaderScript = new Buffer('Li9oZHMvQWRvYmVIRFMucGhw', 'base64').toString('ascii');

	let streamName = new Date();
	streamName = slugify('tvp-' + streamName.toLocaleDateString() + '_' + streamName.toLocaleTimeString());

	let scriptArgs = [downloaderScript, '--referrer', referer, '--manifest', streamURL, '--quality', 'high', '--outdir', destinationDir, '--outfile', streamName];
	let child = spawn('php', scriptArgs);

	child.stdout.on('data', function (data) {
		console.log(`stdout: ${data}`);
	});

	child.stderr.on('data', function (data) {
		console.log(`stderr: ${data}`);
	});

	child.stdin.on('data', function (data) {
		console.log(`stdin: ${data}`);
	});

	child.on('close', function () {
		kill(child.pid);
	});

}