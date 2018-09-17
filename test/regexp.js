'use strict';

var expect = require('chai').expect;
var tokens = require('../lib/tokens.js');

describe('#tokens', function() {
    it('should match comment strings', function() {
        var re = tokens.tokenRegex('comments');
        var res = re.exec("a_valid_token # A comment\n");
        expect(res[0]).to.equal('# A comment\n');
    });
    it('should recognize whitespaces', function() {
        var re = tokens.tokenRegex('whitespace');
        var res = re.exec("a_token # A comment \n another_token");
        expect(res.index).to.equal(7);
        expect(res[0]).to.equal(" # A comment \n ");
    });
    it('should match semicolon text blocks', function() {
        var re = tokens.tokenRegex('semicolontext');
        var res = re.exec("a_token\n;A text block\n\n;\nanother_token");
        expect(res.index).to.equal(8);
        expect(res[0]).to.equal(";A text block\n\n;");
    });
    it('should match (un)quoted strings', function() {
        var re = tokens.tokenRegex('squotestring');
        var res = re.exec("'this and' that");
        expect(res.index).to.equal(0);
        expect(res[0]).to.equal("'this and'");

        var re = tokens.tokenRegex('dquotestring');
        var res = re.exec('this "and that"');
        expect(res.index).to.equal(5);
        expect(res[0]).to.equal('"and that"');

        var re = tokens.tokenRegex('uquotestring');
        var res = re.exec('\nthis and that');
        expect(res.index).to.equal(0);
        expect(res[0]).to.equal('\nthis');

        var re = tokens.tokenRegex('chrstring');
        // Should work in all three cases above!
        var res = re.exec("'this and' that");
        expect(res.index).to.equal(0);
        expect(res[0]).to.equal("'this and'");
        re.lastIndex = 0;
        var res = re.exec(' this "and that"');
        expect(res.index).to.equal(0);
        expect(res[0]).to.equal(' this');
        var res = re.exec('this "and that"');
        expect(res.index).to.equal(5);
        expect(res[0]).to.equal('"and that"');
    });
    it('should match number types', function() {
        var re = tokens.tokenRegex('integer');
        var res = re.exec('He stole +40 cakes;');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('+40');

        var re = tokens.tokenRegex('unsigned_int');
        var res = re.exec('He stole +40 cakes;');
        expect(res.index).to.equal(10);
        expect(res[0]).to.equal('40');

        var re = tokens.tokenRegex('exponent');
        var res = re.exec('He stole 1E+40 cakes;');
        expect(res.index).to.equal(10);
        expect(res[0]).to.equal('E+40');

        var re = tokens.tokenRegex('float');
        var res = re.exec('He stole 40.0e0 cakes');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('40.0e0');

        var re = tokens.tokenRegex('number');
        var res = re.exec('He stole +40 cakes;');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('+40');
        re.lastIndex = 0;
        var res = re.exec('He stole 40.0e0 cakes');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('40.0e0');

        var re = tokens.tokenRegex('numeric');
        var res = re.exec('He stole +40.0E3(25) cakes;');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('+40.0E3(25)');
    });
    it('should match reserved words', function() {
        var re = tokens.tokenRegex('reserved');
        var res = re.exec('this is data');
        expect(res.index).to.equal(8);
        expect(res[0]).to.equal('data');
        re.lastIndex = 0;
        var res = re.exec('and a LooP');
        expect(res.index).to.equal(6);
        expect(res[0].toLowerCase()).to.equal('loop');
    });
    it('should match full items', function() {
        var re = tokens.tokenRegex('tag');
        var res = re.exec('data_my_info 34.3E2');
        expect(res.index).to.equal(4);
        expect(res[0]).to.equal('_my_info');
        var re = tokens.tokenRegex('value');
        var res = re.exec('_data_my_info 34.3E2');
        expect(res.index).to.equal(13);
        expect(res[0]).to.equal(' 34.3E2');
    });
    it('should match loops', function() {
        var re = tokens.tokenRegex('loop_header');
        var res = re.exec('loop_\n_this\n_that But not this');
        expect(res.index).to.equal(0);
        expect(res[0]).to.equal('loop_\n_this\n_that');

        var re = tokens.tokenRegex('loop_body');
        var res = re.exec('loop_\n_this\n_that 0 1 2');
        expect(res.index).to.equal(17);
        expect(res[0]).to.equal(' 0 1 2');
    });
    it('should match data items', function() {
        var re = tokens.tokenRegex('data_item');
        var res = re.exec('_something 10.3E2');
        expect(res.index).to.equal(0);
        expect(res[0]).to.equal('_something 10.3E2');        
        re.lastIndex = 0;
        var res = re.exec('This is a\nLOOP_\n_a\n_b\n0\n1');
        expect(res.index).to.equal(10);
        expect(res[0]).to.equal('LOOP_\n_a\n_b\n0\n1');        
    })
});