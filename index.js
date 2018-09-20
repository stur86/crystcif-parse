'use strict';

/**
 * Parses a cif file in string format, returning it as a data structure
 * @param  {string} ciftext CIF file as a string
 * @return {Object}
 */
module.exports = function crystCifParse(ciftext) {

}

var fs = require('fs');
var parser = require('./lib/parse.js');
var tokens = require('./lib/tokens.js');
var Atoms = require('./lib/cryst.js').Atoms;

//console.log(tokens.tokenRegex('chrstring').exec("'C'  'C'   0.0033   0.0016"));
//console.log(tokens.tokenRegex('loop_body').exec("C1 C 0.6424(3) 0.5942(2) 0.7939(3) 0.0186(5) Uani 1 1 d . . . "));

fs.readFile(process.argv[2], 'utf8',
    function(err, file) {
        var a = Atoms.readCif(file);
        console.log(a);
    });