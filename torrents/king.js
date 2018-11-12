
// https://torrentking.eu/search?mk=inland+empire

const BASE_URL = new Buffer('aHR0cHM6Ly90b3JyZW50a2luZy5ldQ==', 'base64').toString('ascii');
let SEARCH_URL = new Buffer('aHR0cHM6Ly90b3JyZW50a2luZy5ldS9zZWFyY2g/bWs9', 'base64').toString('ascii');

require('colors');

let term = encodeURIComponent(process.argv[2]) || false;

if (!term || term === 'undefined') {
    console.log(`Usage: $ node ${BASE_URL.replace('https://', '')} "my search"`.bold.red);
    process.exit(1);
}

SEARCH_URL = SEARCH_URL.concat(term);

const Crawler = require('crawler');
const readline = require('readline');

const UA_STRINGS = require('../utils/ua-strings');

function getTorrentPage(htmlList, titleKey = '') {
    let downloadList = [];

    htmlList.forEach((element, i) => {
        if (element.attribs.href && element.attribs.href.includes('movie-')) {
            downloadList.push({
                title: element.attribs.title,
                href: element.attribs.href
            });
        } else if (element.attribs['data-magnet']) {
            downloadList.push({
                title: titleKey,
                href: element.attribs['data-magnet']
            });
        }
    });

    return downloadList;
}

function listTorrentPage(htmlList, details = null) {
    let torrentDetails = details && details.length ? details : null;
    htmlList.forEach((element, i) => {
        i++;
        console.log((i < 10 ? ' ' + (i) : i) + ' ' + element.title.yellow.bold + (torrentDetails && torrentDetails[i] ? ' (' + torrentDetails[i] + ')' : ''));
    });
}

let crawlSearchPage = new Crawler({
    rateLimit: Math.floor(Math.random() * 1000),
    maxConnections: 1,
    rotateUA: UA_STRINGS,
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
            process.exit(1);
        } else {
            let $ = res.$;
            let list = $('a').toArray();
            let se = $('.coll-2.seeds').toArray();
            let le = $('.coll-3.leeches').toArray();
            let si = $('.coll-4.size').toArray();

            console.log('Búśćáńdó éń: ' + $('title').text());

            // Filter list of torrents that match the search terms
            let torrentList = getTorrentPage(list, 'title', 'href');

            // LIst the results
            listTorrentPage(torrentList);

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            // Select list result
            rl.question('ṬÓŔṚẸṆṬ LÎ$T: ', (answer) => {

                let crawlResultsPage = new Crawler({
                    rateLimit: Math.floor(Math.random() * 1000),
                    maxConnections: 1,
                    rotateUA: UA_STRINGS,
                    callback: function (error, res, done) {
                        if (error) {
                            console.log(error);
                            process.exit(1);
                        } else {
                            let $ = res.$;

                            // let magnets = $('[data-magnet]').toArray();
                            let details = $('tr').toArray();
                            let magnets = $('tr td div.downa').toArray();

                            let children = details.map(x => x.children);

                            children.shift();

                            let filas = [];
                            children.forEach((child, index) => {
                                let columnas = [];
                                child.forEach(chch => {
                                    if (chch.children && chch.children.length > 0) {
                                        for (let i = 0; i < 4; i++) {
                                            if (typeof chch.children[i] !== 'undefined') {
                                                columnas.push(chch.children[i].data);
                                            }
                                        }
                                    }
                                });
                                if (magnets[index].attribs.class === 'center button-movie-control white') {
                                    filas.push([...magnets[index].attribs.data.magnet, columnas]);
                                }
                                console.log((index + 1) + columnas.join(' ').replace(/\n/g, ''));
                            });

                            const rl2 = readline.createInterface({
                                input: process.stdin,
                                output: process.stdout
                            });

                            // Select single result
                            rl2.question('ṬÓŔṚẸṆṬ DôẄNḶÔÄḐ: ', (answer) => {
                                addMagnetLink(magnets[answer - 1].attribs['data-magnet']);
                                rl2.close();
                                console.log('ṬÓŔṚẸṆṬ ÄḌḐȨḌ: ' + $('title').text());

                            });


                        }
                        done();
                    }
                });
                crawlResultsPage.queue(torrentList[answer - 1].href);
                rl.close();
            });
        }
        done();
    }
});

crawlSearchPage.queue(SEARCH_URL);

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
