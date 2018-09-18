'use strict';

var expect = require('chai').expect;
var cryst = require('../lib/cryst.js');

describe('#cell', function() {
    it('should correctly convert from cartesian to axis-and-angles', function() {
        var cell = [
            [1, 0, 0],
            [0, 2, 0],
            [0, 3, 4]
        ];
        var abc = cryst.cellToCellpar(cell, true);
        expect(abc[1][0]).to.be.closeTo(Math.acos(6 / 10), 1e-6);
    });
});