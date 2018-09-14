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
    it('should find the correct data blocks', function() {
        var test = "data_block_0\n_item 0\ndata_block_1";
        var blocks = parser.parseDataBlocks(test);
        expect(blocks[0][0]).to.equal("block_0");
        expect(blocks[1][0]).to.equal("block_1");
    });

});