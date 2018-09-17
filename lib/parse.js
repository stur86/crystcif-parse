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

function tokenize(cif) {
    /* Split into tokens (separated by non-blank characters except for the
       quoted strings and semicolon text )
    */

    // Grab a bunch of regular expressions
    var all_re = [tokens.tokenRegex('whitespace'),
        tokens.tokenRegex('quotestring'),
        tokens.tokenRegex('semicolontext'),
        tokens.tokenRegex('data_header'),
        tokens.tokenRegex('tag'),
        tokens.tokenRegex('loop_kw')
    ];
    // Now create fake matches for each of them
    var all_m = [];
    for (var i = 0; i < all_re.length; ++i) {
        all_m.push({ 'index': -1 });
    }

    var i = 0;
    var tokenized = [];
    while (i < cif.length) {

        // Refresh the matches
        var first_match = cif.length;
        var match_type = -1;
        for (var j = 0; j < all_re.length; ++j) {
            while (all_m[j] && all_m[j].index < i)
                all_m[j] = all_re[j].exec(cif);
            if (all_m[j] && all_m[j].index < first_match) {
                match_type = j;
                first_match = all_m[j].index;
            }
        }

        if (match_type == 0) {
            // WHITESPACE
            if (first_match == i) {
                // Just trim
                i += all_m[0][0].length;
            } else {
                // A regular value/string
                tokenized.push({
                    'val': cif.slice(i, first_match),
                    'type': 'unknown'
                });
                i = first_match + all_m[0][0].length;
            }
        } else if (match_type > 0) {
            // Another type of token
            tokenized.push({
                'val': all_m[match_type][0],
                'type': ['quotestring', 'semicolontext', 'data_headers',
                    'tag', 'loop_kw'
                ][match_type - 1]
            });
            i = first_match + all_m[match_type][0].length;
        } else {
            // Ran out of string; just put everything into a single value
            tokenized.push({
                'val': cif.slice(i),
                'type': 'unknown'
            });
            i = cif.length;
        }
    }

    return tokenized;
}
module.exports.tokenize = tokenize;

function parseValue(tok) {

    // If it's a string, easy one
    if (tok.type == 'quotestring') {
        return {
            'type': 'string',
            'text': tok.val.slice(1, tok.val.length - 1)
        }
    }
    if (tok.type == 'semicolontext') {
        return {
            'type': 'mstring',
            'text': tok.val.slice(1, tok.val.length - 1)
        }
    }

    if (tok.type != 'unknown') {
        // Something's wrong
        return null;
    }

    // We now know it's unknown, so...
    var strval = tok.val;

    // First, check for special types
    if (strval.trim() == '.') {
        return {
            'type': 'N/A'
        }
    } else if (strval.trim() == '?') {
        return {
            'type': '?'
        }
    }

    var type;
    // It can be a numeric value
    var m = tokens.tokenRegex('numeric', true, true).exec(strval.trim());
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
        if (strnum.match(tokens.tokenRegex('float', true, true))) {
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

    // Or it's just an unquoted string
    return {
        'type': 'string',
        'text': strval
    }
}
module.exports.parseValue = parseValue;

function parseDataBlocks(ciftokens) {
    // Identify all data blocks

    var tagre = tokens.tokenRegex('tag');
    var data_headers = [];
    for (var i = 0; i < ciftokens.length; ++i) {
        var tok = ciftokens[i];
        if (tok.type == 'data_headers') {
            var name = tok.val.match(tagre);
            if (name.length != 1) {
                throw 'Invalid data header ' + tok.val;
            }
            data_headers.push([i, name[0].slice(1)]);
        }
    }

    // Now gather the blocks
    var data_blocks = [];
    for (var i = 0; i < data_headers.length; ++i) {
        var dh = data_headers[i];
        var end = ((i < data_headers.length - 1) ? data_headers[i + 1][0] :
            ciftokens.length);
        var db = [dh[1], ciftokens.slice(dh[0] + 1, end)];
        data_blocks.push(db);
    }

    return data_blocks;
}
module.exports.parseDataBlocks = parseDataBlocks;

function parseDataItems(blocktokens) {
    // Parse the data items inside a data block

    var data_items = [];

    /* There are two possible structures here:
    1) alternating series of tag - value
    2) loop with series of tags, then corresponding series of values  
    */

    // Acceptable value token types
    var vtypes = ['quotestring', 'semicolontext', 'unknown'];

    data_items = [];

    var btokens = blocktokens.slice();
    while (btokens.length > 0) {
        var btok = btokens.shift();
        // What type is it?
        if (btok === undefined) {
            break;
        }
        switch (btok.type) {
            case 'tag':
                var valtok = btokens.shift();
                if (valtok == null || !vtypes.includes(valtok.type)) {
                    throw 'Invalid or missing value for tag ' + btok.val;
                }
                data_items.push({
                    'tag': btok.val,
                    'type': 'single',
                    'value': parseValue(valtok)
                });
                break;
            case 'loop_kw':
                // Start by parsing the header
                var header = [];
                var ltok = btokens.shift();
                while (ltok !== undefined && ltok.type == 'tag') {
                    header.push(ltok.val);
                    ltok = btokens.shift();
                }
                var body = [];
                while (ltok !== undefined && vtypes.includes(ltok.type)) {
                    body.push(parseValue(ltok));
                    ltok = btokens.shift();
                }
                // Put back that last one...
                btokens.unshift(ltok);

                // Check if the loop is correct
                if (body.length % header.length != 0) {
                    throw 'Invalid loop - values must be a multiple of tags';
                }
                var tagn = header.length;
                var loopn = body.length / header.length;

                for (var i = 0; i < header.length; ++i) {
                    var di = {
                        'tag': header[i],
                        'type': 'loop',
                        'value': [],
                    }
                    for (var j = 0; j < loopn; ++j) {
                        di.value.push(body[j * tagn + i]);
                    }
                    data_items.push(di);
                }
                break;
            default:
                break;
        }
    }

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