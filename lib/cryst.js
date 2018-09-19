'use string';

var nm = require('numeric');
var mndtable = require('mendeleev').PeriodicTable;
var utils = require('./utils.js');

/*

Functions and classes useful to transform a parsed CIF data structure into a
series of crystallographic structures.

*/

/**
 *   Convert a cartesian coordinates cell into a lengths and angles representation
 *   @param  {Array} cell    Cartesian form cell (must be 3x3)
 *   @param  {bool}  radians If true, angles are returned in radians
 *   @return {Array}         Parameters in form [lengths, angles]
 */
function cellToCellpar(cell, radians) {
    lengths = cell.map(function(c) { return nm.norm2(c); });
    angles = [];
    for (var i = 0; i < 3; ++i) {
        var j = (i + 2) % 3;
        var k = (i + 1) % 3;
        var ll = lengths[j] * lengths[k];
        if (ll > 1e-16) {
            var x = nm.dot(cell[j], cell[k]) / ll;
            angle = Math.acos(x);
        } else {
            angle = Math.PI / 2.0;
        }
        angles.push(angle);
    }
    if (!radians) {
        angles = angles.map(utils.radToDeg);
    }
    return [lengths, angles];
}
module.exports.cellToCellpar = cellToCellpar;

/**
 *  Convert a cell into lengths and angles representation to cartesian form
 *  @param  {Array} cellpar     Lengths and angles form of cell (must be 2x3)
 *  @param  {Array} ab_normal   Desired direction for the normal to the AB plane
 *  @param  {Array} a_direction Direction for the a parameter
 *  @param  {bool}  radians     If true, consider the angles in radians
 *  @return {Array}             Cell in Cartesian form
 */
function cellparToCell(cellpar, ab_normal, a_direction, radians) {

    ab_normal = ab_normal || [0, 0, 1]; // Default is the XY plane

    if (!a_direction) {
        if (nm.norm2(utils.cross(ab_normal, [1, 0, 0])) < 1e-5) {
            a_direction = [0, 0, 1]; // Only if the AB plane contains X
        } else {
            a_direction = [1, 0, 0];
        }
    }

    // Define rotated X,Y,Z-system, with Z along ab_normal and X along
    // the projection of a_direction onto the normal plane of Z.
    var ad = utils.unit(a_direction);
    var Z = utils.unit(ab_normal);
    var X = utils.unit(nm.sub(ad, nm.mul(nm.dot(ad, Z), Z)));
    var Y = utils.cross(Z, X);

    // Express va, vb and vc in the X,Y,Z-system
    var l = cellpar[0];
    var angs = cellpar[1];

    if (!radians) {
        angs = angs.map(utils.degToRad);
    }

    var cosa = angs.map(Math.cos);
    var sina = angs.map(Math.sin);

    for (var i = 0; i < 3; ++i) {
        // Round for orthorombic cells
        if (Math.abs(Math.abs(sina[i]) - 1) < 1e-14) {
            sina[i] = Math.sign(sina[i]);
            cosa[i] = 0.0;
        }
    }

    // Build the cell vectors
    var va = [l[0], 0, 0];
    var vb = [l[1] * cosa[2], l[1] * sina[2], 0];
    var vc = [l[2] * cosa[1],
        l[2] * (cosa[0] - cosa[1] * cosa[2]) / sina[2],
        0
    ];
    vc[2] = Math.sqrt(l[2] * l[2] - vc[0] * vc[0] - vc[1] * vc[1]);

    // Convert to the Cartesian x, y, z - system
    cell = nm.dot([va, vb, vc], [X, Y, Z]);

    return cell

}
module.exports.cellparToCell = cellparToCell;

/*
 *  A class holding a crystallographic structure. Inspired by the Atoms class
 *  of the Atomic Simulation Environment.
 *  @class
 *  @param {Array}  elems       Array of element symbols or atomic numbers
 *  @param {Array}  positions   Array of 3D positions, in absolute coordinates
 *  @param {Array}  cell        Array describing the unit cell. Can be any of
 *                              the following:
 *                              - false/null: no periodic boundary
 *                              - Single float: cubic cell with that parameter
 *                              - Array of 3 floats: orthorombic cell with 
 *                                those parameters
 *                              - Array of 3x3 floats: full carthesian cell
 *                                definition
 *                              - Any of the previous two, but with one or two
 *                                elements replaced by false/null: partial 
 *                                periodicity
 *  @param {Object} info        Additional data attached to the structure
 */
var Atoms = function(elems, positions, cell, info) {

    // Sanity checks
    var symbols = [];
    var numbers = [];
    for (var i = 0; i < elems.length; ++i) {
        var el = elems[i];
        var a;
        if (typeof(el) == 'number') {
            a = mndtable.getAtomic(el);
        } else {
            a = mndtable.getElement(el);
        }
        if (a === null) {
            throw 'Non-existing element passed to Atoms';
        }
        symbols.push(a.symbol);
        numbers.push(a.number);
    }

    this._arrays = {
        'symbols': symbols,
        'numbers': numbers,
    }
    this._N = symbols.length;

    // Check that it's the right size
    var check_pos = (positions.length == this._N);
    for (var i = 0; i < positions.length; ++i) {
        check_pos = check_pos && (positions[i].length == 3);
    }
    if (!check_pos) {
        throw 'Invalid positions array passed to Atoms';
    }

    this.set_array('positions', positions);

    // Now on to storing the cell
    this.set_cell(cell);

    this.info = info;

}

Atoms.prototype = {
    set_array: function(name, arr) {
        // Check that it's the right shape
        if (!(arr.length == this._N)) {
            throw 'Invalid array size';
        }
        this._arrays[name] = arr;
    },
    get_array: function(name) {
        return this._arrays[name];
    },
    set_cell: function(cell) {
        this._pbc = [true, true, true];
        if (!cell) {
            this._pbc = [false, false, false];
            this._cell = null;
        } else if (typeof(cell) == 'number') {
            var a = cell;
            this._cell = [
                [a, 0, 0],
                [0, a, 0],
                [0, 0, a]
            ];
        } else if (cell.length != 3) {
            throw 'Invalid cell passed to set_cell';
        } else {
            this._cell = [];
            for (var i = 0; i < 3; ++i) {
                if (!cell[i]) {
                    this._cell.push(null);
                    this._pbc[i] = false;
                } else if (typeof(cell[i]) == 'number') {
                    var row = [0, 0, 0];
                    row[i] = cell[i];
                    this._cell.push(row);
                } else if (cell[i].length != 3) {
                    throw 'Invalid cell passed to set_cell';
                } else {
                    this._cell.push(cell[i]);
                }
            }
        }
    },
    get_cell: function() {
        return utils.deepClone(this._cell);
    },
    get_pbc: function() {
        return utils.deepClone(this._pbc);
    }
}

module.exports.Atoms = Atoms;