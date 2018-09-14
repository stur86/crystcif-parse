'use strict';

/**
 * Parses a cif file in string format, returning it as a data structure
 * @param  {string} ciftext CIF file as a string
 * @return {Object}
 */
module.exports = function crystCifParse(ciftext) {
    
}

var fs = require('fs');
var parseCif = require('./lib/parse.js').parseCif;

fs.readFile(__dirname + '/examples/example_single.cif', 'utf8',
    function(err, file) {
        parseCif(file);
    });  