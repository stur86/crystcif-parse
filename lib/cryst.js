'use strict';

var nm = require('numeric');
var mndtable = require('mendeleev').PeriodicTable;

var utils = require('./utils.js');
var parseCif = require('./parse.js').parseCif;
var parseSymOp = require('./symmetry.js').parseSymOp;

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
    var lengths = cell.map(function(c) { return nm.norm2(c); });
    var angles = [];
    for (var i = 0; i < 3; ++i) {
        var j = (i + 2) % 3;
        var k = (i + 1) % 3;
        var ll = lengths[j] * lengths[k];
        if (ll > 1e-16) {
            var x = nm.dot(cell[j], cell[k]) / ll;
            var angle = Math.acos(x);
        } else {
            var angle = Math.PI / 2.0;
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
    var cell = nm.dot([va, vb, vc], [X, Y, Z]);

    return cell
}
module.exports.cellparToCell = cellparToCell;

/*
 *  A class holding a crystallographic structure. Inspired by the Atoms class
 *  of the Atomic Simulation Environment.
 *  @class
 *  @param {Array}  elems       Array of element symbols or atomic numbers
 *  @param {Array}  positions   Array of 3D positions
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
 *  @param {bool}   scaled      If true, interpret the positions as scaled
 *                              instead of absolute
 *  @param {bool}   tolerant    If true, accept even symbols of elements that
 *                              do not exist in the periodic table
 */
var Atoms = function(elems, positions, cell, info, scaled, tolerant) {

    // Sanity checks
    var symbols = [];
    var numbers = [];
    for (var i = 0; i < elems.length; ++i) {
        var el = elems[i];
        var a;
        var is_num = (typeof(el) == 'number');
        if (is_num) {
            a = mndtable.getAtomic(el);
        } else {
            a = mndtable.getElement(el);
        }
        if (a === null) {
            if (is_num || !tolerant) {
                throw 'Non-existing element passed to Atoms';
            } else {
                a = {
                    'symbol': el, // Default for unknown element symbols
                    'number': -1
                }
            }
        }
        symbols.push(a.symbol);
        numbers.push(a.number);
    }

    this._arrays = {
        'symbols': symbols,
        'numbers': numbers,
    }
    this._N = symbols.length;

    // Now on to storing the cell
    this._pbc = [true, true, true];
    this._inv_cell_T = null;
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

    if (cell && !(this._cell.includes(null)))
        this._inv_cell_T = nm.transpose(nm.inv(this._cell));

    // Check that the positions are the right size
    var check_pos = (positions.length == this._N);
    for (var i = 0; i < positions.length; ++i) {
        check_pos = check_pos && (positions[i].length == 3);
    }
    if (!check_pos) {
        throw 'Invalid positions array passed to Atoms';
    }

    if (scaled) {
        if (this._inv_cell_T === null) {
            // Periodicity isn't full!
            throw 'Impossible to use scaled coordinates with non-periodic system';
        }
        positions = nm.dot(positions, this._cell);
    }

    this.set_array('positions', positions);


    info = info || {};
    this.info = info;
}

// Prototype for Atoms. We focus on getters, not setters, because it's not 
// meant to be modified besides its arrays.
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
    get_cell: function() {
        return utils.deepClone(this._cell);
    },
    get_pbc: function() {
        return utils.deepClone(this._pbc);
    },
    get_positions: function() {
        return utils.deepClone(this.get_array('positions'));
    },
    get_scaled_positions: function() {
        var pos = this.get_array('positions');
        return nm.dot(pos, this._inv_cell_T);
    }
}

// Utility functions needed for CIF parsing. Not meant for outside use!

/** 
 *  This function extracts a series of tags from a cif block. It searches for
 *  them and, if they are loops, only returns the ones that are as long as the
 *  FIRST element of tags (which is assumed obligatory; if not found, null is
 *  returned)
 */
function _extract_tags(cblock, tags) {
    var extracted = tags.map(function(tag) {
        return cblock[tag];
    });
    if (extracted[0] === undefined)
        return null;
    // Verify that, in case of loops, all tags have the same length
    var basetype = extracted[0].type;
    var baselen = null;
    if (basetype == 'loop') {
        baselen = extracted[0].value.length;
    }

    extracted = extracted.map(function(x) {
        if (x === undefined)
            return null;
        if (x.type != basetype)
            return null;
        if (basetype == 'loop' && x.value.length != baselen)
            return null;

        if (basetype == 'loop') {
            return x.value;
        } else {
            return [x.value];
        }
    });

    return extracted;
}

function _atom_types(cblock) {
    // Extract atom types from cblock
    var atype_tags = ['_atom_type_symbol',
        '_atom_type_description',
        '_atom_type_radius_bond'
    ];
    var typevals = _extract_tags(cblock, atype_tags);
    if (!typevals) {
        return null; // No types found
    }

    var atypes = {};
    for (var i = 0; i < typevals[0].length; ++i) {
        var sym = typevals[0][i].text;
        atypes[sym] = {};
        for (var j = 1; j < atype_tags.length; ++j) {
            if (typevals[j] != null)
                atypes[sym][atype_tags[j].slice(11)] =
                typevals[j][i].get_value();
        }
    }

    return atypes;
}

function _atom_sites(cblock) {
    // Extract atom sites from cblock
    var asite_tags = ['_atom_site_label',
        '_atom_site_type_symbol',
        '_atom_site_Cartn_x',
        '_atom_site_Cartn_y',
        '_atom_site_Cartn_z',
        '_atom_site_fract_x',
        '_atom_site_fract_y',
        '_atom_site_fract_z'
    ];
    var sitevals = _extract_tags(cblock, asite_tags);
    if (!sitevals) {
        return null; // No sites found
    }

    var asites = [];
    for (var i = 0; i < sitevals[0].length; ++i) {
        asites.push({});
        for (var j = 0; j < asite_tags.length; ++j) {
            if (sitevals[j] != null)
                asites[i][asite_tags[j].slice(11)] = sitevals[j][i].get_value();
        }
    }

    return asites;
}

function _cellpars(cblock) {

    var cell_tags = [
        '_cell_length_a',
        '_cell_length_b',
        '_cell_length_c',
        '_cell_angle_alpha',
        '_cell_angle_beta',
        '_cell_angle_gamma'
    ];

    var cellpars = [
        [],
        []
    ];
    for (var i = 0; i < 6; ++i) {
        var val = cblock[cell_tags[i]];
        if (val === undefined)
            return null;
        cellpars[Math.floor(i / 3)].push(val.value.get_value());
    }

    return cellpars;
}

function _symops(cblock) {

    // Look for either tag
    var symopvals = (cblock._space_group_symop_operation_xyz ||
        cblock._symmetry_equiv_pos_as_xyz);

    if (!symopvals || symopvals.type == 'single' ||
        symopvals.value.length == 1) {
        // Either way is pointless (only one value means identity)
        return null;
    }

    var symops = [];

    for (var i = 1; i < symopvals.value.length; ++i) {
        symops.push(parseSymOp(symopvals.value[i].text));
    }

    return symops;
}

/** CIF to Atoms parser
 *  @static
 *  @param  {string}    cif     CIF file in text format
 *  @return {Object}            Dictionary of parsed crystal structures
 */
Atoms.readCif = function(cif) {

    var cifdict = parseCif(cif);

    // Consider any data block
    var structs = {};
    for (var bname in cifdict) {
        var block = cifdict[bname];
        if ('_atom_site_label' in block) {
            structs[bname] = block;
        }
    }

    for (var sname in structs) {
        var cblock = cifdict[sname];
        // Start by identifying atom types, if present
        var atypes = _atom_types(cblock);
        var asites = _atom_sites(cblock);
        var cellpars = _cellpars(cblock);

        // Is this system periodic?
        var pbc = (cellpars !== null);
        if (pbc) {
            var cell = cellparToCell(cellpars);
        }

        // Extract symbols, labels, and positions
        var symbols = [];
        var labels = [];
        var positions = [];
        for (var i = 0; i < asites.length; ++i) {
            symbols.push(asites[i].type_symbol);
            labels.push(asites[i].label);
            var p = [asites[i].Cartn_x, asites[i].Cartn_y, asites[i].Cartn_z];
            if (p.some(function(x) { return x === undefined; })) {
                // Then we need the fractional ones!
                if (!pbc) {
                    // Does not make sense...
                    throw 'Absolute coordinates are necessary without a unit cell';
                }
                p = [asites[i].fract_x, asites[i].fract_y, asites[i].fract_z];
                p = nm.dot(p, cell);
            }
            positions.push(p);
        }

        // Now for symmetry oprations...
        if (pbc) {
            var symops = _symops(cblock);
            if (!symops)
                break;

            var N = positions.length;
            var fpos = nm.dot(positions, nm.transpose(nm.inv(cell)));
            // Otherwise, find the new positions
            for (var i = 0; i < symops.length; ++i) {
                var rot = symops[i][0];
                var tr = symops[i][1];
                for (var j = 0; j < N; ++j) {
                    var p = fpos[j];
                    p = nm.add(nm.dot(rot, p), tr);
                    // Is it equivalent to something else?
                    var eq = false;
                    for (var k = 0; k < fpos.length; ++k) {
                        var r = nm.norm2(nm.sub(p, fpos[k]));
                        if (r < 1e-8) {
                            eq = true;
                            break;
                        }
                    }
                    if (!eq) {
                        fpos.push(p);
                    }
                }
            }
            positions = nm.dot(fpos, cell);
        }

        console.log(symops);        
        console.log(positions);

        //console.log(labels);

        // Look for symmetry if yes
    }

}

module.exports.Atoms = Atoms;