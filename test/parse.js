'use strict';

var fs = require('fs');
var expect = require('chai').expect;
var tokens = require('../lib/tokens.js');
var parser = require('../lib/parse.js');

/*

        fs.readFile(__dirname + '/../examples/example_single.cif', 'utf8',
            function(err, file) {
                parser.parseCif(file);
            });        
 */

describe('#parsing', function() {
    it('should correctly strip away comments', function() {
        var test = "# This is a comment \ndata_block # This one too\n";
        var stripped = parser.stripComments(test);
        expect(stripped).to.equal("data_block ")
    });
    it('should correctly split in tokens', function() {
        var test = " _tag 12 C 'test string' loop_\ndata_block";
        var tk = parser.tokenize(test);
        expect(tk[0].val).to.equal("_tag");
        expect(tk[1].type).to.equal("unknown");
        expect(tk[3].val).to.equal("'test string'");
        expect(tk[5].val).to.equal("data_block");
    });
    it('should identify the right data blocks', function() {
        var test = "data_1 _tag value data_2 _tag value _tag value";
        var tk = parser.tokenize(test);
        var bl = parser.parseDataBlocks(tk);
        expect(bl[0][0]).to.equal("1");
        expect(bl[1][0]).to.equal("2");
        expect(bl[0][1].length).to.equal(2);
        expect(bl[0][1][0].type).to.equal('tag');
        expect(bl[1][1].length).to.equal(4);
        expect(bl[0][1][1].type).to.equal('unknown');
    });
    it('should correctly parse values', function() {
        var testtok = {
            'type': 'unknown',
            'val': '56.4e3(45)'
        }
        var val = parser.parseValue(testtok);
        expect(val.num).to.equal(56400);
        expect(val.prec).to.equal(45);

        var testtok = {
            'type': 'unknown',
            'val': 'thing'
        }
        var val = parser.parseValue(testtok);
        expect(val.type).to.equal('string');
    });
    it('should correctly parse a series of data items', function() {
        var test = '_one 1.0 _fortytwo 42 _string str loop_ _a _b 1 2 3 4';
        var tk = parser.tokenize(test);
        var items = parser.parseDataItems(tk);
        expect(items[0].value.type).to.equal('float');
        expect(items[1].value.num).to.equal(42);
        expect(items[2].tag).to.equal('_string');
        expect(items[3].tag).to.equal('_a');
        expect(items[3].value[1].num).to.equal(3);
        expect(items[4].value[0].num).to.equal(2);
    });
    /*
    it('should correctly identify data items', function() {
        var test = "_a 5\n_b 1.2e3\n_c 4.5(34)\n_d 'Word'\n_e ;\nParagraph\n;";
        var items = parser.parseDataItems(test);
        for (var i = 0; i < 5; ++i) {
            expect(items[i].tag).to.equal(['_a', '_b', '_c', '_d', '_e'][i]);
            if (i < 3) {
                expect(items[i].value.num).to.equal([5, 1200, 4.5][i]);
            } else {
                expect(items[i].value.text).to
                    .equal(['Word', '\nParagraph\n'][i - 3]);
            }
        }
        var test = "loop_\n_a\n_b\n0\n;\nTest\n;\n1\n'Test 2'";
        var items = parser.parseDataItems(test);
        expect(items[0].tag).to.equal('_a');
        expect(items[1].tag).to.equal('_b');
        expect(items[0].type).to.equal('loop');
        expect(items[1].type).to.equal('loop');
        expect(items[0].value[0].num).to.equal(0);
        console.log(items[1].value[0]);
        console.log(items[0].value[1]);
        console.log(items[1].value[1]);
        expect(items[1].value[1].text).to.equal('Test 2');
    })
    */

});