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

// console.log(SEARCH_URL);
// process.exit(0);

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

            console.log('Búśćáńdó éń: ' + $('title').text());

            let downloadList = [];
            let i = 1;

            list.forEach(element => {
                console.log((i < 10 ? ' ' + (i) : i) + ' ' + element.children[0].data + ' * ' + '(' + element.attribs.href + ')');

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
                            let subtitles = $('.detalle_link').toArray();

                            console.log('ḌÒẈṆĻÓÀḌÏŅĜ: ' + $('title').text());

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

                    // console.log(file);

                    // file.stdout.on('data', function (data) {});

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
                            tool = 'unrar-nonfree';
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
                                exec('rm ' + res.options.filename);
                                let slugified = slugify(subtitle);
                                let rename = spawn('mv', [subtitle, slugified]);
                                rename.on('close', () => {
                                    kill(rename.pid);
                                });
                                kill(extract.pid);
                            });
                            kill(subtitleFile.pid);
                        });
                        kill(file.pid);
                    });
                    compressedFile.close();
                });

                // a.close(function (data) {
                //     a.write(chunk)
                //     console.log('closed1');
                //     a.close(console.log.bind(null, 'closed2'));
                // });


            }
            done();
            // writeStream.on('close', () => {

            // process.exit(0);

            // });

            // const kill = require('tree-kill');
            // const spawn = require('child_process').spawn;
            // const exec = require('child_process').exec;
            // let fileType = spawn('file', ['-b', res.options.filename]);

            // console.log(fileType);

            // fileType.stdout.on('data', function (data) {
            //     console.log(`stdout: ${data}`);
            // });

            // fileType.stderr.on('data', function (data) {
            //     console.log(`stderr: ${data}`);
            // });

            // fileType.stdin.on('data', function (data) {
            //     console.log(`stdin: ${data}`);
            // });
        }
    });

    d2.queue({
        uri: subtitleLink,
        filename: slugify(fileName)
    });

}