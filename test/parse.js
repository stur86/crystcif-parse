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

});