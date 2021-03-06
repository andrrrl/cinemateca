require('colors');

let term = encodeURIComponent(process.argv[2]) || false;

if (!term || term === 'undefined') {
    console.log(`Usage: $ node ${BASE_URL.replace('http://', '')} "my search"`.bold.red);
    process.exit(1);
}

const Crawler = require('crawler');
const readline = require('readline');

const UA_STRINGS = require('../utils/ua-strings');
const BASE_URL = new Buffer('aHR0cDovLzEzMzd4LnRv', 'base64').toString('ascii');
const URL = new Buffer('aHR0cDovLzEzMzd4LnRvL3NyY2g/c2VhcmNoPQ==', 'base64').toString('ascii').concat(term);

function listTorrents(torrentList){
    let downloadList = [];
    let i = 1;
    torrentList.forEach(element => {
        console.log((i < 10 ? ' ' + (i) : i) + ' ' + element.children[0].data + 
        '\t\tsize: ' + si[i-1].children[0].data + ' | se: ' + se[i-1].children[0].data + ' | le: ' + le[i-1].children[0].data);

        downloadList.push({
            name: element.children[0].data,
            href: element.attribs.href
        });

        i++;
    });

    return downloadList;
}

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
            let list = $('.coll-1.name a:not(.icon)').toArray();
            let se = $('.coll-2.seeds').toArray();
            let le = $('.coll-3.leeches').toArray();
            let si = $('.coll-4.size').toArray();

            console.log('Búśćáńdó éń: ' + $('title').text());
            
            

            listTorrents(list);

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question('ṬÓŔṚẸṆṬ #: ', (answer) => {

                let d = new Crawler({
                    rateLimit: Math.floor(Math.random() * 1000),
                    maxConnections: 1,
                    rotateUA: UA_STRINGS,
                    callback: function (error, res, done) {
                        if (error) {
                            console.log(error);
                            process.exit(1);
                        } else {
                            let $ = res.$;
                            let magnet = $('[href^=magnet]').toArray();

                            console.log('ṬÓŔṚẸṆṬ ÄḌḐȨḌ: ' + $('title').text());
                            addMagnetLink(magnet[0].attribs.href);
                        }
                        done();
                    }
                });
                d.queue(BASE_URL + downloadList[answer - 1].href);

                rl.close();
            });
        }
        done();
    }
});
c.queue(URL);

function addMagnetLink(magnetLink) {

    console.log(`Saving torrent ${magnetLink}`);

    const kill = require('tree-kill');
    const spawn = require('child_process').spawn;

    let torrentClient = 'rtorrent';

    let scriptArgs = [torrentClient, magnetLink];
    let child = spawn(torrentClient, scriptArgs);

    child.stdout.on('data', function (data) {
        console.log(`${data}`);
    });

    child.stderr.on('data', function (data) {
        // console.log(`stderr: ${data}`);
    });

    child.stdin.on('data', function (data) {
        // console.log(`stdin: ${data}`);
    });

    child.on('close', function () {
        kill(child.pid);
    });

}
