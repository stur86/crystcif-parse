# crystcif-parse

A JavaScript parser for  Crystallographic Information File (CIF) files.
This module provides a barebone structure to parse the CIF data format and
interpret some basic keywords in order to retrieve a crystal structure.

### Supported:
* parsing of CIF 1.1 syntax
* partial interpretation of structural core dictionary keywords (position, cell
  parameters, labels)
* basic treatment of symmetry (symmetry operations)
* spacegroup symbols

### Not supported yet:
* CIF 2.0 syntax
* non-essential atomic properties (masses, charges, bonds, etc.)

## Module contents

The module exposes to the user a few core methods and classes that are useful
for the sake of parsing CIF files and handling the resulting structures.

```javascript
parseCifStructures(ciftext);
```

Parses the file passed as `ciftext` in form of string and returns a 
dictionary of `Atoms` classes, with the names of the corresponding data
blocks as keys.

```javascript
parseCif(ciftext)
```

Parses the file passed as `ciftext` in form of string and returns a dictionary
with data block names as keys. The blocks contain in turn the tags for any data
items, each corresponding to a full data item entry and corresponding value 
(represented by specific classes).

```javascript
Atoms(elems, positions, cell, info, scaled, tolerant)
```

A class defining a single crystal structure. Inspired by the Python class of 
the same name in the [Atomic Simulation Environment](https://wiki.fysik.dtu.dk/ase/index.html).
It is created by passing the following arguments:

* `elems`: Array of element symbols of atomic numbers
* `positions`: Array of xyz coordinates for each atom
* `cell`: unit cell for the structure. If not passed, the structure will not be
  considered periodic. Can be an Array of three numbers (treated as orthorombic 
  cell with sides [a,b,c]), an Array of two Arrays of three for lengths and 
  angles, or an Array of three Arrays of three for cartesian components
* `info`: a dictionary of any additional information necessary
* `scaled`: if `true`, the coordinates are considered fractional instead of
  absolute
* `tolerant`: if `true`, any unknown chemical symbols are accepted instead of
  causing an exception. Unknown atomic numbers will still fail

The `Atoms` class also provide the following methods to access its various
properties:

* `.length()`
* `.get_positions()`
* `.get_scaled_positions()`
* `.get_chemical_symbols()`
* `.get_atomic_numbers()`
* `.get_cell()`
* `.get_pbc()` (return periodic boundary conditions in X, Y, Z as an array of
  `Boolean`)
* `.get_array(name)` and `.set_array(name, array)` for getting and setting
  additional custom properties



