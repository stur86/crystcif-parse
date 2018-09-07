'use strict';

var tokens = require('./tokens.js');

/**
 * Parses a cif file returning the data blocks and items (not interpreted)
 * @param  {string} ciftext CIF file as a string
 * @return {Object}         
 */
module.exports = function parseCif(ciftext) {

    // First: strip all comments
    var commre = tokens.tokenRegex('comments');
    var ciftextstrip = ciftext.replace(commre, '');

    // Then identify all data blocks
    var datare = RegExp('[\s\n]+data_', 'gi');
    var data_headers = [];
    var res = null;
    do {
        res = datare.exec(ciftextstrip);
        if (res != null) {
            var tagre = tokens.tokenRegex('tag');
            var tagres = tagre.exec(ciftextstrip.slice(res.index));
            if (tagres == null) {
                throw new Error('Invalid data block found at ' + res.index);
            }
            data_headers.push([res[0], res.index, tagres[0].slice(1)]);
        }
    } while(res != null)

    console.log(data_headers);
}