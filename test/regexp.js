'use strict';

var expect = require('chai').expect;
var tokens = require('../lib/tokens.js');

describe('#tokens', function() {
    it('should match comment strings', function() {
        var re = RegExp(tokens.comments, 'g');
        var res = re.exec("a_valid_token # A comment\n");
        expect(res[0]).to.equal('# A comment\n');
    });
    it('should recognize whitespaces', function() {
        var re = RegExp(tokens.whitespace);
        var res = re.exec("a_token # A comment \n another_token");
        expect(res.index).to.equal(7);
        expect(res[0]).to.equal(" # A comment \n ");
    });
    it('should match semicolon text blocks', function() {
        var re = RegExp(tokens.semicolontext);
        var res = re.exec("a_token\n;A text block\n\n;\nanother_token");
        expect(res.index).to.equal(8);
        expect(res[0]).to.equal(";A text block\n\n;");
    });
});
