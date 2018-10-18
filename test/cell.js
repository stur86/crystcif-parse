'use strict';

var expect = require('chai').expect;

var nm = require('numeric');
var cryst = require('../lib/cryst.js');
var utils = require('../lib/utils.js');
var symm = require('../lib/symmetry.js');

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
    it('should correctly convert from axis-and-angles to cartesian',
        function() {
            var abc = [
                [3, 1, 1],
                [90, 90, 60]
            ];
            var cell = cryst.cellparToCell(abc, [0, 0, 1], [1, 0, 0]);
            expect(cell[0]).to.be.eql([3, 0, 0]);
            for (var i = 0; i < 3; ++i) {
                var t = [0.5, Math.sqrt(3) / 2.0, 0.0][i];
                expect(cell[1][i]).to.be.closeTo(t, 1e-12);
            }
            expect(cell[2]).to.be.eql([0, 0, 1]);

            // Now check for the case where the normals are different
            var abn = utils.unit([0, 1, 1]);
            var adir = utils.unit([0.5, -1, 1]);
            var cell = cryst.cellparToCell(abc, abn, adir);

            expect(nm.dot(cell[2], abn)).to.be.closeTo(1, 1e-12);
            expect(nm.dot(cell[0], adir)).to.be.closeTo(3, 1e-12);
            expect(nm.dot(cell[1], adir)).to.be.closeTo(0.5, 1e-12);
        });
    it('should properly parse symmetry operations', function() {
        var symop = symm.parseSymOp('x,-y+1/2,z');
        expect(symop[0]).to.eql([
            [1, 0, 0],
            [0, -1, 0],
            [0, 0, 1]
        ]);
        expect(symop[1]).to.eql([0, 0.5, 0]);
    });
    it('should correctly interpret Hall symbols', function() {
        var symops = symm.interpretHallSymbol('-P 1');
        expect(symops[1][0]).to.eql([
            [-1, 0, 0],
            [0, -1, 0],
            [0, 0, -1]
        ]);
        expect(symops[1][1]).to.eql([0, 0, 0]);
    })
});