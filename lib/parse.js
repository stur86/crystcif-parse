'use strict';

var tokens = require('./tokens.js');

/**
 * Parses a cif file returning the data blocks and items (not interpreted)
 * @param  {string} ciftext CIF file as a string
 * @return {Object}         
 */

function stripComments(cif) {
    var commre = tokens.tokenRegex('comments');
    var stripped = cif.replace(commre, '');
    return stripped;
}
module.exports.stripComments = stripComments;

function parseValue(strval) {

    // First, check for special types
    if (strval.trim() == '.') {
        return {
            'type': 'N/A'
        }
    }
    else if (strval.trim() == '?') {
        return {
            'type': '?'
        }
    }

    var type;
    // It can be either a numeric value or a string of some sort
    var m = tokens.tokenRegex('numeric', true).exec(strval.trim());
    if (m) {
        // Does it have a precision?
        var prec = null;
        var strnum = m[3]; // Will be undefined if there's a precision
        if (strnum === undefined) {
            prec = parseInt(m[2]);
            strnum = m[1];
        }
        // Integer or float?
        var num;
        if (strnum.match(tokens.tokenRegex('float', true))) {
            num = parseFloat(strnum);
            type = 'float';
        } else {
            num = parseInt(strnum);
            type = 'int';
        }

        return {
            'type': type,
            'num': num,
            'prec': prec
        };
    }

    // It's important to try to pick up this possibility before the next one
    // Semicolontext?
    m = tokens.tokenRegex('semicolontext', true).exec(strval.trim());
    if (m) {
        var strval = m[0].slice(1, m[0].length - 1);
        return {
            'type': 'mstring', // Multi-line string
            'text': strval,
        }
    }

    // Chrstring?
    // Not trimmed because it CAN include white spaces / EOLs
    // Also, start by checking for single/double quote string
    m = tokens.tokenRegex('chrstring').exec(strval);
    if (m) {
        var strval = m[0];
        if (!strval.match(tokens.tokenRegex('uquotestring'))) {
            // Quoted string
            strval = strval.slice(1, strval.length - 1);
        }
        else {
            strval = strval.slice(1);
        }
        return {
            'type': 'string',
            'text': strval
        }
    }

    return null;
}
module.exports.parseValue = parseValue;

function parseLoop(loop) {
    // Start by reading in all the tags
    var tagre = tokens.tokenRegex('tag');
    var tags = [];
    var tag_end = 0;
    var res = null;
    do {
        res = tagre.exec(loop);
        if (res !== null) {
            tags.push(res[0]);
            tag_end = tagre.lastIndex;
        }
    } while (res !== null);

    // Now on to the values!
    var valre = tokens.tokenRegex('value');
    valre.lastIndex = tag_end; // Start from where we left off
    var values = [];
    do {
        res = valre.exec(loop);
        if (res !== null) {
            console.log(res[0]);
            values.push(parseValue(res[0]));
            console.log(values);
        }
    } while (res !== null);

    console.log("LOOP:");
    console.log(tags);
    console.log(values);

    // Now on to assign values to tags
    var tag_n = tags.length;
    var loop_n = values.length / tag_n;
    if (loop_n % 1 != 0) {
        // Invalid loop
        throw 'Invalid loop - values are not a multiple of tags';
    }

    var loop_data = [];
    // Initialise data objects
    for (var i = 0; i < tag_n; ++i) {
        loop_data.push({
            'type': 'loop',
            'tag': tags[i],
            'value': []
        });
    }

    // Fill in values
    for (var i = 0; i < loop_n; ++i) {
        for (var j = 0; j < tag_n; ++j) {
            loop_data[j].value.push(values[tag_n * i + j]);
        }
    }

    return loop_data;
}
module.exports.parseLoop = parseLoop;

function parseDataBlocks(cif) {
    // Identify all data blocks
    var datare = RegExp('(^|[\s\n]+)data_', 'gi');
    var data_headers = [];
    var res = null;
    do {
        res = datare.exec(cif);
        if (res !== null) {
            // Match the tag to an appropriate substring
            var tagre = tokens.tokenRegex('tag');
            var tagres = tagre.exec(cif.slice(res.index +
                    res[0].length - 1)
                .split(/[ \n\t]+/)[0]);
            if (tagres === null) {
                throw new Error('Invalid data block found at ' + res.index);
            }
            var tagname = tagres[0].slice(1);
            data_headers.push([res[0], res.index,
                res.index + res[0].length + tagres[0].length - 1,
                tagname
            ]);
        }
    } while (res !== null);

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
module.exports.parseDataBlocks = parseDataBlocks;

function parseDataItems(block) {
    // Parse the data items inside a data block

    var itemre = tokens.tokenRegex('data_item');

    var data_items = [];

    var res = null;
    do {
        res = itemre.exec(block);
        if (res !== null) {
            // Is it a loop?
            var loopre = tokens.tokenRegex('loop_header');
            if (res[0].match(loopre)) {
                // LOOP
                data_items = data_items.concat(parseLoop(res[0]))
            } else {
                // NOT LOOP
                var tag = res[1];
                var value = res[2];

                data_items.push({
                    'type': 'single',
                    'tag': tag,
                    'value': parseValue(value)
                });
            }
        }
    } while (res !== null);

    return data_items;
}
module.exports.parseDataItems = parseDataItems;

module.exports.parseCif = function parseCif(ciftext) {

    // First: strip all comments
    var ciftextstrip = stripComments(ciftext);

    // Now extract all data blocks
    var data_blocks = parseDataBlocks(ciftextstrip);

    for (var i in data_blocks) {
        var block = data_blocks[i];
        console.log(block[0]);
        var items = parseDataItems(block[1]);
        for (var j in items) {
            var item = items[j];
            console.log(item);
        }

    }
    // SAVE frames are not supported for now, so we only look for data items
}