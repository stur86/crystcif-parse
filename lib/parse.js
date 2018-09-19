'use strict';

var tokens = require('./tokens.js');

/** Represents a single value (string or numerical) in a CIF file.
 *  @class
 *  @param  {string}    type      Type of the value (int, float, string, mstring,
 *                                N/A or ?)
 *  @param  {*}         pvalue]   Parsed value itself (should be appropriate to
 *                                type, unnecessary for N/A and ?)
 *  @param  {int}       [prec]    Precision number (only for numerals)
 */
var CifValue = function(type, value, prec) {
    /** @member {string} */
    this.type = type;
    /** @member {int} */
    this.prec = prec;

    switch (type) {
        case 'int':
        case 'float':
            /** @member {number} */
            this.num = value;
            break;
        case 'string':
        case 'mstring':
            /** @member {string} */
            this.text = value;
            break;
        default:
            break;
    }
}

CifValue.prototype = {
    get_value: function() {
        return (this.num !== undefined) ? this.num : this.text; // Universal function
    }
}

/**
 *  Split a text CIF file into elementary tokens for further processing.
 *  @param  {string} cif    CIF file in text string format
 *  @return {Array}         Array of parsed tokens
 */
function tokenize(cif) {
    /* Split into tokens (separated by non-blank characters except for the
       quoted strings and semicolon text )
    */

    // Grab a bunch of regular expressions
    var all_re = [tokens.tokenRegex('whitespace', false, false),
        tokens.tokenRegex('quotestring', true),
        tokens.tokenRegex('semicolontext', true),
        tokens.tokenRegex('tag', true),
        tokens.tokenRegex('data_header', true),
        tokens.tokenRegex('loop_kw', true)
    ];
    // Now create fake matches for each of them
    var all_m = [];
    for (var i = 0; i < all_re.length; ++i) {
        all_m.push({ 'index': -1 });
    }

    var tokenized = [];
    var cifsl = cif.slice();
    while (cifsl.length > 0) {

        // First, try to see if it's any of the various non-whitespace types
        var m_type = 1;
        var m = null;
        for (; m_type < all_re.length; ++m_type) {
            m = cifsl.match(all_re[m_type]);
            if (m)
                break;
        }
        if (m) {
            tokenized.push({
                'val': m[0],
                'type': ['quotestring', 'semicolontext', 'tag',
                    'data_headers', 'loop_kw'
                ][m_type - 1]
            });
            cifsl = cifsl.slice(m[0].length);
            continue;
        }

        // Now check for whitespace
        all_re[0].lastIndex = 0;
        var w = all_re[0].exec(cifsl);
        if (w) {
            if (w.index == 0) {
                // Trim
                cifsl = cifsl.slice(w[0].length);
            } else {
                // Capture an unknown
                // A regular value/string
                tokenized.push({
                    'val': cifsl.slice(0, w.index),
                    'type': 'unknown'
                });
                cifsl = cifsl.slice(w.index + w[0].length);
            }
            continue;
        }

        // Ran out of string to parse
        if (cifsl.length > 0) {
            tokenized.push({
                'val': cifsl,
                'type': 'unknown'
            });
            break;
        }
    }

    return tokenized;
}
module.exports.tokenize = tokenize;

/**
 *  Parse a single token as a value.
 *  @param  {Object} tok    Token to parse (must not be a reserved keyword
 *                          like a data_ or loop_ token)
 *  @return {CifValue}      Parsed value
 */
function parseValue(tok) {

    // If it's a string, easy one
    if (tok.type == 'quotestring') {
        return new CifValue('string', tok.val.slice(1, tok.val.length - 1));
    }
    if (tok.type == 'semicolontext') {
        return new CifValue('mstring', tok.val.slice(1, tok.val.length - 1));
    }

    if (tok.type != 'unknown') {
        // Something's wrong
        return null;
    }

    // We now know it's unknown, so...
    var strval = tok.val;

    // First, check for special types
    if (strval.trim() == '.') {
        return new CifValue('N/A');
    } else if (strval.trim() == '?') {
        return new CifValue('?');
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

        return new CifValue(type, num, prec);
    }

    // Or it's just an unquoted string
    return new CifValue('string', strval);
}
module.exports.parseValue = parseValue;

/**
 * Finds and splits the data blocks from a tokenized CIF file.
 * @param  {Array}   ciftokens   Array of tokens contained in the file
 * @return {Array}               Array of data blocks in the form 
 *                               [name, [tokens]]
 */
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

/**
 * Parses a series of tokens defining a data block into data items.
 * @param  {Array}  blocktokens  Array of tokens defining the block
 * @return {Array}               Array of parsed tata items
 */
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

/**
 * Parses a cif file returning the data blocks and items (not interpreted).
 * @param  {string} ciftext CIF file as a string
 * @return {Object}         Parsed CIF file as data structure
 */
module.exports.parseCif = function parseCif(ciftext) {

    // First, extract the tokens
    var tk = tokenize(ciftext);
    // Then the blocks
    var db = parseDataBlocks(tk);
    // Now on to the items for each block
    var cifdict = {};
    for (var i = 0; i < db.length; ++i) {
        var block = db[i];
        cifdict[block[0]] = {};
        // SAVE frames are not supported for now, so we only look 
        // for data items
        var items = parseDataItems(block[1]);
        for (var j = 0; j < items.length; ++j) {
            cifdict[block[0]][items[j].tag] = items[j];
        }
    }

    return cifdict;
}