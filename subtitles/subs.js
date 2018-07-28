require('colors');

let term = encodeURIComponent(process.argv[2]) || false;

if (!term || term === 'undefined') {
    console.log('Usage: $ node subs.js "my search"'.bold.red);
    process.exit(1);
}

const Crawler = require('crawler');
const slugify = require('slugify');
const fs = require('fs');
const readline = require('readline');

const UA_STRINGS = require('../utils/ua-strings');
const BASE_URL = new Buffer('aHR0cHM6Ly93d3cuc3ViZGl2eC5jb20vaW5kZXgucGhw', 'base64').toString('ascii');
const SEARCH_URL = BASE_URL.concat(new Buffer('P2FjY2lvbj01Jm1hc2Rlc2M9JnN1YnRpdHVsb3M9MSZyZWFsaXphX2I9MSZidXNjYXI9', 'base64').toString('ascii')).concat(term);

let c = new Crawler({
    rateLimit: Math.floor(Math.random() * 100),
    maxConnections: 1,
    rotateUA: UA_STRINGS,
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
            process.exit(1);
        } else {
            let $ = res.$;
            
            let list = $('.titulo_menu_izq').toArray();
			let desc = $('#buscador_detalle_sub').toArray();

            console.log('Búśćáńdó éń: ' + $('title').text());

            let downloadList = [];
            let i = 1;

            list.forEach(element => {
                console.log((i < 10 ? ' ' + (i) : i) + ' ' + element.children[0].data + '\n\t' + '(' + desc[i-1].children[0].data + ')');

                downloadList.push({
                    name: element.children[0].data,
                    href: element.attribs.href
                });

                i++;
            });

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question('ŜÜḄṬÏŢĻÈ #: ', (answer) => {

                let d = new Crawler({
                    rateLimit: Math.floor(Math.random() * 100),
                    maxConnections: 1,
                    rotateUA: UA_STRINGS,
                    callback: function (error, res, done) {
                        if (error) {
                            console.log(error);
                            process.exit(1);
                        } else {
                            let $ = res.$;

                            console.log($('a'));

                            // let subtitles = $('.detalle_link').toArray();
                            let subtitles = $('.link1').toArray();

                            console.log('ḌÒẈṆĻÓÀḌÏŅĜ: ' + $('title').text());
                            // console.log(subtitles.map(x => x.attribs));

                            let subtitle = subtitles.find(x => x.attribs.href.match('bajar'));
                            downloadSubtitle(subtitle.attribs.href, downloadList[answer - 1].name);
                        }
                        done();
                    }
                });
                d.queue(downloadList[answer - 1].href);

                rl.close();
            });
        }
        done();
    }
});
c.queue(SEARCH_URL);

function downloadSubtitle(subtitleLink, fileName) {

    console.log(`Saving subtitle file: ${subtitleLink}`);

    let d2 = new Crawler({
        encoding: null,
        jQuery: false, // set false to suppress warning message.
        callback: (err, res, done) => {
            if (err) {
                console.error(err.stack);
            } else {

                fileName = slugify(fileName);
                var compressedFile = fs.createWriteStream(res.options.filename);

                compressedFile.write(res.body, () => {

                    const kill = require('tree-kill');
                    const spawn = require('child_process').spawn;
                    const exec = require('child_process').exec;
                    let file = spawn('file', ['-b', res.options.filename]);

                    let fileType = '';
                    file.stdout.on('data', (type) => {
                        console.log(`stdout: ${type}`);
                        fileType = type.toString();
                    });

                    file.on('close', function () {

                        let tool = '',
                            scriptArgsList = [];
                        if (fileType.match(/zip/ig)) {
                            tool = 'unzip';
                            scriptArgsList = ['-Z', '-l', res.options.filename];
                            extractArg = '-q';
                        } else if (fileType.match(/rar/ig)) {
                            tool = 'unrar-free';
                            scriptArgsList = ['lb', res.options.filename];
                            extractArg = 'e';
                        }

                        let subtitleFile = spawn(tool, scriptArgsList);

                        let subtitle = '';
                        subtitleFile.stdout.on('data', function (data) {
                            subtitle = data.toString().split('\n').find(x => x.match(/(.*)\.srt$/gi));
                        });

                        subtitleFile.stderr.on('data', function (data) {
                            console.log(`stderr: ${data}`);
                        });

                        subtitleFile.stdin.on('data', function (data) {
                            console.log(`stdin: ${data}`);
                        });

                        subtitleFile.on('close', function () {
                            console.log(subtitle);
                            let extract = spawn(tool, [extractArg, res.options.filename, subtitle]);
                            extract.on('close', () => {
								let slugified = slugify(subtitle);
								let rename = spawn('mv', [subtitle, slugified]);
								rename.on('close', () => {
									let latin2utf8 = spawn('../utils/latin2utf8', [slugified]);
									latin2utf8.on('close', () => {
									exec('rm ' + res.options.filename);
									kill(latin2utf8.pid);
								});
									kill(rename.pid);
								kill(extract.pid);
									});
                            });
                            kill(subtitleFile.pid);
                        });
                        kill(file.pid);
                    });
                    compressedFile.close();
                });

            }
            done();
        }
    });

    d2.queue({
        uri: subtitleLink,
        filename: slugify(fileName)
    });

}
