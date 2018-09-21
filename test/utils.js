'use strict';

var expect = require('chai').expect;
var utils = require('../lib/utils.js');

describe('#utils', function() {
    it('should correctly compute a unit vector', function() {
        var v = [0, 3, 4];
        var u = utils.unit(v);
        expect(u).to.eql([0, 3 / 5, 4 / 5]);
    });
    it('should correctly verify multiple elements', function() {
        var a = utils.includesAll([1, 2, 3, 4], [1, 2]);
        expect(a).to.be.true;
        var a = utils.includesAll([1, 2, 3, 4], [1, 5]);
        expect(a).to.be.false;
    });
    it('should correctly reduce vectors to modulo 1', function() {
        var v = [1.2, 0.5, -3.4];
        var u = utils.mod1(v);
        for (var i = 0; i < 3; ++i)
            expect(u[i]).to.be.closeTo([0.2, 0.5, 0.6][i], 1e-5);
    })
})