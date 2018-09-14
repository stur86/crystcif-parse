'use strict';

var tokens = require('./tokens.js');

/**
 * Parses a cif file returning the data blocks and items (not interpreted)
 * @param  {string} ciftext CIF file as a string
 * @return {Object}         
 */

module.exports.stripComments = function stripComments(cif) {
    var commre = tokens.tokenRegex('comments');
    var stripped = cif.replace(commre, '');
    return stripped;
}

module.exports.parseDataBlocks = function parseDataBlocks(cif) {
    // Identify all data blocks
    var datare = RegExp('(^|[\s\n]+)data_', 'gi');
    var data_headers = [];
    var res = null;
    do {
        res = datare.exec(cif);
        if (res != null) {
            // Match the tag to an appropriate substring
            var tagre = tokens.tokenRegex('tag');
            var tagres = tagre.exec(cif.slice(res.index +
                    res[0].length - 1)
                .split(/[ \n\t]+/)[0]);
            if (tagres == null) {
                throw new Error('Invalid data block found at ' + res.index);
            }
            var tagname = tagres[0].slice(1);
            data_headers.push([res[0], res.index,
                res.index + res[0].length + tagres[0].length - 1,
                tagname
            ]);
        }
    } while (res != null)

    // Now actually parse the data blocks

    var data_blocks = [];

    for (var i = 0; i < data_headers.length; ++i) {
        var dh = data_headers[i];
        var endi = (i + 1 < data_headers.length ?
            data_headers[i + 1][1] : cif.length);
        data_blocks.push([dh[3], cif.slice(dh[2], endi)]);
    }

    return data_blocks;
}

module.exports.parseCif = function parseCif(ciftext) {

    // First: strip all comments
    var ciftextstrip = stripComments(ciftext);

    // Now extract all data blocks
    var data_blocks = parseDataBlocks(ciftextstrip);

    // SAVE frames are not supported for now, so we only look for data items
}