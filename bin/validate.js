#!/usr/bin/env node

'use strict';

var fs = require('fs');
var Atoms = require('../lib/cryst.js').Atoms;

var files = process.argv.slice(2);

for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    // Read in file contents
    var fc = fs.readFile(f, 'utf8', (err, data) => {
        try {
            var a = Atoms.readCif(data);
        } catch (emsg) {
            console.log('CIF file ' + f + ' failed to parse: ' + emsg);
            err = emsg;
        }
        if (!err) {
            console.log('CIF file ' + f + ' parsed successfully!');
        }        
    });
}