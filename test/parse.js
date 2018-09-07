'use strict';

var fs = require('fs');
var tokens = require('../lib/tokens.js');
var parseCif = require('../lib/parse.js');

fs.readFile(__dirname + '/../examples/example_single.cif', 'utf8',
    function(err, file) {
        parseCif(file);
    });