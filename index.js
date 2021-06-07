'use strict';

var parser = require('./lib/parse.js');
var Atoms = require('./lib/cryst.js').Atoms;

/**
 * Parses a cif file in string format, returning it as a data structure
 * @param  {string} ciftext CIF file as a string
 * @return {Object}
 */
module.exports.parseCifStructures = function(ciftext) {
    return Atoms.readCif(ciftext);
}

// Additional exports
module.exports.Atoms = Atoms;
module.exports.parseCif = parser.parseCif;