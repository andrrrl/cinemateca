
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

function getTorrentPage(htmlList, titleKey = ''){
    let downloadList = [];

    htmlList.forEach((element, i) => {
        if (element.attribs.href && element.attribs.href.includes('movie-')) {
            downloadList.push({
                title: element.attribs.title,
                href: element.attribs.href
            });
        } else if(element.attribs['data-magnet']) {
                downloadList.push({
                    title: titleKey,
                    href: element.attribs['data-magnet']
                });
        }
    });

    return downloadList;
}

function listTorrentPage(htmlList, details = null){
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
                            
                            let magnets = $('[data-magnet]').toArray();
                            let details = $('tr').toArray();
                            // details = details.map(x => x.children.map(y => y.data)).filter(y => typeof y[0] === 'string');

                            console.log(details.map(tr => tr.children.map(td => td.data)));
                            process.exit(1);

                            // Filter list of torrents that match the search terms
                            let downloadList = getTorrentPage(magnets, torrentList[answer - 1].title);

                            // LIst the results
                            listTorrentPage(downloadList, details);

                            const rl2 = readline.createInterface({
                                input: process.stdin,
                                output: process.stdout
                            });

                            // Select single result
                            rl2.question('ṬÓŔṚẸṆṬ DôẄNḶÔÄḐ: ', (answer) => {
                            let crawlTorrents = new Crawler({
                                rateLimit: Math.floor(Math.random() * 1000),
                                maxConnections: 1,
                                rotateUA: UA_STRINGS,
                                callback: function (error, res, done) {
                                    if (error) {
                                        console.log(error);
                                        process.exit(1);
                                    } else {
                                        let $ = res.$;

                                        let magnets = $('[data-magnet]').toArray();

                                        console.log('magnets', magnets);
                                        // process.exit(0);
                                        
                                    //     console.log('ṬÓŔṚẸṆṬ ÄḌḐȨḌ: ' + $('title').text());
                                    //     addMagnetLink(magnets[0].attribs.href);
                                    }
                                    done();
                                }
                            });
                            crawlTorrents.queue(downloadList[answer - 1].href);
                            rl2.close();
                            console.log('ṬÓŔṚẸṆṬ ÄḌḐȨḌ: ' + $('title').text());
                            // addMagnetLink(magnets[0].attribs.href);

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
