# crystcif-parse

A JavaScript parser for Crystallography CIF files. This module provides a
barebone structure to parse the CIF data format and interpret some basic
keywords in order to retrieve a crystal structure.

### Supported:
* parsing of CIF 1.1 syntax
* partial interpretation of structural core dictionary keywords (position, cell
  parameters, labels)
* basic treatment of symmetry (symmetry operations)

### Not supported yet:
* CIF 2.0 syntax
* spacegroup symbols
* non-essential atomic properties (masses, charges, bonds, etc.)


