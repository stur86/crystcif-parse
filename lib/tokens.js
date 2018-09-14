'use strict';

/* Rules taken from the technical specification for CIF 1.1 as seen at:

    https://www.iucr.org/resources/cif/spec/version1.1/cifsyntax
*/

// CIF format standard tokens in RegExp form

var sp = ' ';
var ht = '\\t';
var eol = '\\n'; // Carriage return missing for now; need to figure out how to make it work...

/*

<OrdinaryChar>:

{ '!' | '%' | '&' | '(' | ')' | '*' | '+' | ',' | '-' | '.' | '/' | '0' | '1' 
| '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ':' | '<' | '=' | '>' | '?' 
| '@' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' 
| 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' 
| 'Z' | '\' | '^' | '`' | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' 
| 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' 
| 'w' | 'x' | 'y' | 'z' | '{' | '|' | '}' | '~' }
 */
var ordinary_char = "a-zA-Z0-9!%&\(\)*+,\-.\/:<=>\?@\\^`\{\¦\}~";
module.exports.ordinary_char = "[" + ordinary_char + "]";
/*

<NonBlankChar>:

<OrdinaryChar> | <double_quote> | '#' | '$' | <single_quote> | '_' |';' | '[' 
| ']' 
 */
var nonblank_char = ordinary_char + "\"#$'_;\\[\\]";
module.exports.nonblank_char = "[" + nonblank_char + "]";
// These variations are useful for strings with quotes
var nonblank_char_nosingle = ordinary_char + "\"#$_;\\[\\]";
var nonblank_char_nodouble = ordinary_char + "#$'_;\\[\\]";
/*

<TextLeadChar>:

<OrdinaryChar> | <double_quote> | '#' | '$' | <single_quote> | '_' | <SP> | 
<HT> |'[' | ']' 
 */
var textlead_char = ordinary_char + "\"#$'_\\[\\]" + sp + ht;
module.exports.textlead_char = "[" + textlead_char + "]";
/*

<AnyPrintChar>:

<OrdinaryChar> | <double_quote> | '#' | '$' | <single_quote> | '_' | <SP> |
<HT> | ';' | '[' | ']'  
 */
var anyprint_char = nonblank_char + sp + ht;
module.exports.anyprint_char = "[" + anyprint_char + "]";
/*

<Digit>

{ '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' }
 */
var digit = '0-9';
module.exports.digit = "[" + digit + "]";
/*

<Comments>

{ '#' {<AnyPrintChar>}* <eol>}+ 
 */
var comments = "(?:#[" + anyprint_char + "]*" + eol + ")+";
module.exports.comments = comments;
/*

<TokenizedComments>

{ <SP> | <HT> | <eol> |}+ <Comments>    
 */
var tok_comments = "[" + sp + ht + eol + "]+" + comments;
module.exports.tok_comments = tok_comments;
/*

<WhiteSpace>

{ <SP> | <HT> | <eol> | <TokenizedComments>}+   
 */
var whitespace = "(?:" + tok_comments + "|" + sp + "|" + ht + "|" + eol +
    ")+";
module.exports.whitespace = whitespace;
/*

<SemiColonTextField>

';' { {<AnyPrintChar>}* <eol>
{{<TextLeadChar> {<AnyPrintChar>}*}? <eol>}*
} ';'
 */
var semicolontext = ";[" + anyprint_char + "]*" + eol +
    "(?:(?:[" + textlead_char + "][" + anyprint_char + "]*)?" + eol + ")*;";
module.exports.semicolontext = semicolontext;
/*

<SingleQuotedString>

<single_quote>{<AnyPrintChar>}* <single_quote>
 */
var squotestring = "'[" + nonblank_char_nosingle + sp + ht + "]*'";
module.exports.squotestring = squotestring;
/*

<DoubleQuotedString>

<double_quote>{<AnyPrintChar>}* <double_quote>
 */
var dquotestring = '"[' + nonblank_char_nodouble + sp + ht + ']*"';
module.exports.dquotestring = dquotestring;
/* 

<UnquotedString>

<eol><OrdinaryChar> {<NonBlankChar>}*   
or 
<eol><OrdinaryChar> {<NonBlankChar>}*   
<noteol>{<OrdinaryChar>|';'} {<NonBlankChar>}
**/
var uquotestring = "((?<=[" + eol + "])[" + ordinary_char + "][" + nonblank_char + "]*|(?<=[^" + eol + "])[;" + ordinary_char + "][" + nonblank_char + "]*)";
module.exports.uquotestring = uquotestring;
/*

<CharString>

<UnquotedString> | <SingleQuotedString> | <DoubleQuotedString>  
 */
var chrstring = "(?:" + squotestring + "|" + dquotestring + "|" +
    uquotestring + ")";
module.exports.chrstring = chrstring;
/*

<UnsignedInteger>

{ <Digit> }+
 */
var unsigned_int = "[" + digit + "]+";
module.exports.unsigned_int = unsigned_int;
/*

<Integer>

{ '+' | '-' }? <UnsignedInteger>
 */
var integer = "[+\-]?" + unsigned_int;
module.exports.integer = integer;
/*

<Exponent>

{ {'e' | 'E' } | {'e' | 'E' } { '+' | '- ' } } <UnsignedInteger>
 */
var exponent = "[eE]" + integer;
module.exports.exponent = exponent;
/*

<Float>

{ <Integer><Exponent> | { {'+'|'-'} ? { {<Digit>} * '.' <UnsignedInteger> } |
{ <Digit>} + '.' } } {<Exponent>} ? } }
 */
var float = "(?:(?:[+\-]?(?:[" + digit + "]*\\." + unsigned_int +
    "|[" + digit + "]+\\.)(?:" + exponent + ")?)|(?:" + integer +
    exponent + "))";
module.exports.float = float;
/*

<Number>

{<Integer> | <Float> }
 */
var number = "(?:" + float + "|" + integer + ")";
module.exports.number = number;
/*

<Numeric>

{ <Number> | <Number> '(' <UnsignedInteger> ')' }
 */
var numeric = "(?:(" + number + ")\\((" + unsigned_int + ")\\)|(" + number +
    "))";
module.exports.numeric = numeric;
/*

<Tag>

'_'{ <NonBlankChar>}+
 */
var tag = "_[" + nonblank_char + "]+";
module.exports.tag = tag;
/*

<Value> 

{ '.' | '?' | <Numeric> | <CharString> | <TextField> }
 */
var value = "(\\.|\\?|" + numeric + "|" + chrstring + "|" + semicolontext +
    ")";
module.exports.value = value;
/*

<LoopHeader>

<LOOP_> {<WhiteSpace> <Tag>}+
 */
var loop_header = "[Ll][Oo][Oo][Pp]_(" + whitespace + tag + ")+";
module.exports.loop_header = loop_header;
/*

<LoopBody>

<Value> { <WhiteSpace> <Value> }*   
 */
var loop_body = value + "(" + whitespace + value + ")*";
module.exports.loop_body = loop_body;
/*

<DataItem>

<Tag> <WhiteSpace> <Value> | <LoopHeader> <LoopBody>
 */
var data_item = "(?:(" + tag + ")" + whitespace + value + "|" + loop_header +
    loop_body + ")";
module.exports.data_item = data_item;
// Reserved keywords
module.exports.reserved = "(data|loop|global|save|stop)";

// Utility function to get ready regular expressions
module.exports.tokenRegex = function(tname, whole) {
    var flags = 'g';
    if (tname == 'reserved') {
        flags = 'gi';
    }
    var restr = module.exports[tname];
    if (whole) {
        restr = '^' + restr + '$';
    }
    return RegExp(restr, flags);
}