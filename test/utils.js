'use strict';

var expect = require('chai').expect;
var utils = require('../lib/utils.js');

describe('#utils', function() {
    it('should correctly compute a unit vector', function() {
        var v = [0, 3, 4];
        var u = utils.unit(v);
        expect(u).to.eql([0, 3 / 5, 4 / 5]);
    });
})