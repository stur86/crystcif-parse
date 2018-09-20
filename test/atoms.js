'use strict';

var expect = require('chai').expect;
var Atoms = require('../lib/cryst.js').Atoms;

describe('#atoms', function() {

    it('should fail if given non-existent atom species', function() {
        expect(function() {
            var a = new Atoms(['Zz']);
        }).to.throw();
    });
    it('should fail if given arrays of inconsistent length', function() {
        expect(function() {
            var a = new Atoms(['C', 'C'], [
                [1, 1, 1]
            ]);
        }).to.throw();
        expect(function() {
            var a = new Atoms(['C', 'C'], [
                [1, 1, 1],
                [1]
            ]);
        }).to.throw();
    });
    it('should store positions in array', function() {
        var a = new Atoms(['C'], [
            [0, 0, 0]
        ]);
        expect(a.get_array('positions')[0][0]).to.equal(0);
    });
    it('should deal appropriately with cells', function() {
        var a = new Atoms([], [], 1);
        expect(a.get_cell()[0]).to.eql([1, 0, 0]);
        var a = new Atoms([], [], [1, 2, 3]);
        expect(a.get_cell()).to.eql([
            [1, 0, 0],
            [0, 2, 0],
            [0, 0, 3]
        ]);
        var a = new Atoms([], [], [1, 1, null]);
        expect(a.get_pbc()).to.eql([true, true, false]);
    });
    it('should compute properly fractional coordinates', function() {
        var a = new Atoms(['C'], [
            [0.5, 0.5, 1]
        ], [
            [1, 1, 0],
            [1, -1, 0],
            [0, 0, 2]
        ]);
        expect(a.get_scaled_positions()).to.eql([
            [0.5, 0, 0.5]
        ]);
    });
    it('should handle fractional coordinates as an input', function() {
        var a = new Atoms(['C'], [
                [0.5, 0.5, 0.0]
            ], [
                [1, 1, 0],
                [0, 3, 0],
                [0, 0, 1]
            ], {},
            true);
        expect(a.get_positions()).to.eql([
            [0.5, 2.0, 0]
        ]);
    });
    it('should throw an error with unknown species only if not tolerant',
        function() {

            expect(function() {
                var a = new Atoms(['X']);
            }).to.throw;

            var a = new Atoms(['X'], [[0, 0, 0]], null, null, false, true);

        });

});