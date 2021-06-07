#!/usr/bin/env node

'use strict';

var Atoms = require('../lib/cryst.js').Atoms;

var files = process.argv.slice(2);

for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    var err = null;
    try {
        var a = Atoms.readCif(f);
    } catch (emsg) {
        console.log('CIF file ' + f + ' failed to parse: ' + emsg);
    }
    if (!err) {
        console.log('CIF file ' + f + ' parsed successfully!');
    }
}