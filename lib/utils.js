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

/**
 *  Returns the unit vector version of v
 *  @param  {Array} v
 *  @return {Array}     Unit vector
 */
function unit(v) {
    var n = Math.sqrt(v.reduce(function(s, x) {
        return s + x * x;
    }, 0));
    return v.map(function(x) {
        return x / n;
    });
}
module.exports.unit = unit;

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