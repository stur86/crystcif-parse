'use strict';

var symdata = require('../data/symmetry.json');

/* Symmetry and space group related methods 
 */

/**
 * Parse a symmetry operation string in the format:
 *     +x,y-1/2,z
 * into a rotation matrix + translation vector representation.
 * @param  {string} symopstr A string representation of the symmetry operation
 * @return {Object}          The symmetry operation as [rotation, translation]
 */
function parseSymOp(symopstr) {
    // First, split by commas
    var xyz = symopstr.split(',');
    if (xyz.length != 3) {
        throw 'Invalid symop string';
    }
    // Then capture all elements
    var symre = /([+-]{0,1})(?:([xyz])|(?:([0-9]+)\/([0-9]+)))/g;
    var rotm = []; // Rotation
    var trns = []; // Translation

    for (var i = 0; i < 3; ++i) {
        var tokens = [];
        symre.lastIndex = 0;
        var r = [0, 0, 0];
        var t = 0.0;
        do {
            var res = symre.exec(xyz[i]);
            if (!res)
                break;
            var sign = (res[1] == '-') ? -1 : 1;
            if (res[2] === undefined) {
                // Translation!
                t += sign * parseFloat(res[3]) / parseFloat(res[4]);
            } else {
                // Rotation!
                var i = 'xyz'.search(res[2]);
                r[i] += sign;
            }
        } while (res);
        rotm.push(r);
        trns.push(t);
    }

    return [rotm, trns];
}
module.exports.parseSymOp = parseSymOp;

/**
 * Interpret a Hall symbol and return a full list of symmetry
 * operations for it in.
 * @param  {string} hsym Hall symbol
 * @return {Object}      Symmetry operations as list of [rotation, translation]
 */
function interpretHallSymbol(hsym) {

    var hsym = hsym.trim()

    for (var i = 1; i <= 530; ++i) {
        // Iterate over all spacegroups
        if (symdata[i]['hall_symbol'] == hsym) {
            var rotms = symdata[i]['rotations'];
            var trnss = symdata[i]['translations'];

            return rotms.map(function(r, i) {
                return [r, trnss[i]];
            });
        }
    }

    throw 'Invalid Hall symbol';
}
module.exports.interpretHallSymbol = interpretHallSymbol;