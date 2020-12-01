'use strict';

/* Utility functions */

/**
 *  Deep clone an object
 *  @param  {Object}    obj     Object to clone
 *  @return {Object}            Clone 
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
module.exports.deepClone = deepClone;

/**
 *  Cross product of two vectors of 3 elements
 *  @param  {Array} v1  
 *  @param  {Array} v2
 *  @return {Array}     v1 X v2
 */
function cross(v1, v2) {
    return [v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0]
    ];
}
module.exports.cross = cross;

/** Norm of a vector v
 *  @param  {Array}  v   
 *  @return {Number}    Norm of v
 */
function norm(v) {
    return Math.sqrt(v.reduce(function(s, x) {
        return s + x * x;
    }, 0));
}
module.exports.norm = norm;

/**
 *  Returns the unit vector version of v
 *  @param  {Array} v
 *  @return {Array}     Unit vector
 */
function unit(v) {
    var n = norm(v);
    return v.map(function(x) {
        return x / n;
    });
}
module.exports.unit = unit;


/**
 * Reduce a vector to modulo 1 (interval [0,1]). Meant for fractional 
 * coordinates
 * @param  {Array} v 
 * @return {Array}      Reduced vector
 */
function mod1(v) {
    return v.map(function(x) {
        x = x % 1;
        return x >= 0 ? x : x + 1
    });
}
module.exports.mod1 = mod1;

var _deg2rad = Math.PI / 180.0;
/**
 *  Convert degrees to radians
 *  @param  {number}    deg     Angle in degrees
 *  @return {number}            Angle in radians
 */
function degToRad(deg) {
    return deg * _deg2rad;
}
module.exports.degToRad = degToRad;

/**
 *  Convert radians to degrees
 *  @param  {number}    rad     Angle in radians
 *  @return {number}            Angle in degrees
 */
function radToDeg(rad) {
    return rad / _deg2rad;
}
module.exports.radToDeg = radToDeg;

/**
 *  Check if an array includes multiple elements
 *  @param  {Array}     arr     Array to check
 *  @param  {Array}     elems   Elements to search in arr
 *  @return {bool}              Whether the check was successful
 */
function includesAll(arr, elems) {
    var ans = true;
    for (var i = 0; i < elems.length; ++i) {
        ans = ans && arr.includes(elems[i]);
    }
    return ans;
}
module.exports.includesAll = includesAll;

/**
 * Shortest periodic length of a distance in fractional coordinates
 * @param  {Array} fx Fractional coordinates vector (p2-p1)
 * @return {Number}   Shortest length including periodic boundary conditions
 */
function shortestPeriodicLength(fx) {
    var r = norm(fx);

    for (var dx = -1; dx < 2; ++dx) {
        for (var dy = -1; dy < 2; ++dy) {
            for (var dz = -1; dz < 2; ++dz) {
                if (dx == 0 && dy == 0 && dz == 0)
                    continue;
                var df = [fx[0] + dx, fx[1] + dy, fx[2] + dz];
                r = Math.min(r, norm(df));
            }
        }
    }

    return r;
}
module.exports.shortestPeriodicLength = shortestPeriodicLength;