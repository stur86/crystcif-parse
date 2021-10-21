'use strict';

var fs = require('fs');
var expect = require('chai').expect;
var tokens = require('../lib/tokens.js');
var parser = require('../lib/parse.js');

describe('#parsing', function() {
    it('should correctly split in tokens', function() {
        var test = " _tag 12 C 'test string' loop_\ndata_block";
        var tk = parser.tokenize(test);
        expect(tk[0].val).to.equal("_tag");
        expect(tk[1].type).to.equal("unknown");
        expect(tk[3].val).to.equal("'test string'");
        expect(tk[5].val).to.equal("data_block");
    });
    it('should correctly deal with Windows-style line endings', function() {
        var test = "_tag 0\r\n_tag 1"
        var tk = parser.tokenize(test);
        expect(tk[0].val).to.equal("_tag");
        expect(tk[1].val).to.equal("0");
        expect(tk[2].val).to.equal("_tag");
        expect(tk[3].val).to.equal("1");

        expect(tk[0].line).to.equal(1);
        expect(tk[2].line).to.equal(2);
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
    it('should parse a whole file', function() {
        var contents = fs.readFileSync(__dirname +
            '/../examples/example_single.cif',
            'utf8');

        var cifdict = parser.parseCif(contents);

        expect(cifdict).to.have.property('global');
        expect(cifdict).to.have.property('I');

        expect(cifdict.global._publ_body_element.type).to.equal('loop');
        expect(cifdict.I._chemical_formula_moiety.value.text).to.equal(
            'C19 H19 N O3');
    });
    it('should throw appropriate errors', function() {

        // Tags with no value
        var test = '_tag 1\n_tag\n_tag';
        var tk = parser.tokenize(test);
        expect(() => { parser.parseDataItems(tk); }).to.throw(
            'ERROR @ line 2: Invalid or missing value for tag _tag');

        // Bad loop
        test = 'loop_\n_atom_site_label\n_atom_site_type_symbol\nC';
        tk = parser.tokenize(test);
        expect(() => { parser.parseDataItems(tk); }).to.throw(
            'ERROR @ line 4: Invalid loop - values must be a multiple of tags');
    });
});