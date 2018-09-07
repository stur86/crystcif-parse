'use strict';

var expect = require('chai').expect;
var tokens = require('../lib/tokens.js');

describe('#tokens', function() {
    it('should match comment strings', function() {
        var re = tokens.token_regex('comments');
        var res = re.exec("a_valid_token # A comment\n");
        expect(res[0]).to.equal('# A comment\n');
    });
    it('should recognize whitespaces', function() {
        var re = tokens.token_regex('whitespace');
        var res = re.exec("a_token # A comment \n another_token");
        expect(res.index).to.equal(7);
        expect(res[0]).to.equal(" # A comment \n ");
    });
    it('should match semicolon text blocks', function() {
        var re = tokens.token_regex('semicolontext');
        var res = re.exec("a_token\n;A text block\n\n;\nanother_token");
        expect(res.index).to.equal(8);
        expect(res[0]).to.equal(";A text block\n\n;");
    });
    it('should match (un)quoted strings', function() {
        var re = tokens.token_regex('squotestring');
        var res = re.exec("'this' and that");
        expect(res.index).to.equal(0);
        expect(res[0]).to.equal("'this'");

        var re = tokens.token_regex('dquotestring');
        var res = re.exec('this and "that"');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('"that"');

        var re = tokens.token_regex('uquotestring');
        var res = re.exec('\nthis and that');
        expect(res.index).to.equal(0);
        expect(res[0]).to.equal('\nthis');

        var re = tokens.token_regex('chrstring');
        // Should work in all three cases above!
        var res = re.exec("'this' and that");
        expect(res.index).to.equal(0);
        expect(res[0]).to.equal("'this'");
        re.lastIndex = 0;
        var res = re.exec('this and "that"');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('"that"');
        re.lastIndex = 0;
        var res = re.exec('\nthis and that');
        expect(res.index).to.equal(0);
        expect(res[0]).to.equal('\nthis');
    });
    it('should match number types', function() {
        var re = tokens.token_regex('integer');
        var res = re.exec('He stole +40 cakes;');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('+40');

        var re = tokens.token_regex('unsigned_int');
        var res = re.exec('He stole +40 cakes;');
        expect(res.index).to.equal(10);
        expect(res[0]).to.equal('40');

        var re = tokens.token_regex('exponent');
        var res = re.exec('He stole 1E+40 cakes;');
        expect(res.index).to.equal(10);
        expect(res[0]).to.equal('E+40');

        var re = tokens.token_regex('float');
        var res = re.exec('He stole 40.0e0 cakes');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('40.0e0');

        var re = tokens.token_regex('number');
        var res = re.exec('He stole +40 cakes;');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('+40');
        re.lastIndex = 0;
        var res = re.exec('He stole 40.0e0 cakes');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('40.0e0');

        var re = tokens.token_regex('numeric');
        var res = re.exec('He stole +40.0E3(25) cakes;');
        expect(res.index).to.equal(9);
        expect(res[0]).to.equal('+40.0E3(25)');
    });
    it('should match reserved words', function() {
        var re = tokens.token_regex('reserved');
        var res = re.exec('this is data');
        expect(res.index).to.equal(8);
        expect(res[0]).to.equal('data');
        re.lastIndex = 0;
        var res = re.exec('and a LooP');
        expect(res.index).to.equal(6);
        expect(res[0].toLowerCase()).to.equal('loop');
    });
    it('should match full items', function() {
        var re = tokens.token_regex('tag');
        var res = re.exec('data_my_info 34.3E2');
        expect(res.index).to.equal(4);
        expect(res[0]).to.equal('_my_info');
        var re = tokens.token_regex('value');
        var res = re.exec('data_my_info 34.3E2');
        expect(res.index).to.equal(13);
        expect(res[0]).to.equal('34.3E2');
    })
});