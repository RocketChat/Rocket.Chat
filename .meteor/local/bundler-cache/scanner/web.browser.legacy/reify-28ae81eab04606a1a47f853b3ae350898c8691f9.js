"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHtml = void 0;
var tslib_1 = require("tslib");
var regex_lib_1 = require("../regex-lib");
var utils_1 = require("../utils");
// For debugging: search for other "For debugging" lines
// import CliTable from 'cli-table';
/**
 * Parses an HTML string, calling the callbacks to notify of tags and text.
 *
 * ## History
 *
 * This file previously used a regular expression to find html tags in the input
 * text. Unfortunately, we ran into a bunch of catastrophic backtracking issues
 * with certain input text, causing Autolinker to either hang or just take a
 * really long time to parse the string.
 *
 * The current code is intended to be a O(n) algorithm that walks through
 * the string in one pass, and tries to be as cheap as possible. We don't need
 * to implement the full HTML spec, but rather simply determine where the string
 * looks like an HTML tag, and where it looks like text (so that we can autolink
 * that).
 *
 * This state machine parser is intended just to be a simple but performant
 * parser of HTML for the subset of requirements we have. We simply need to:
 *
 * 1. Determine where HTML tags are
 * 2. Determine the tag name (Autolinker specifically only cares about <a>,
 *    <script>, and <style> tags, so as not to link any text within them)
 *
 * We don't need to:
 *
 * 1. Create a parse tree
 * 2. Auto-close tags with invalid markup
 * 3. etc.
 *
 * The other intention behind this is that we didn't want to add external
 * dependencies on the Autolinker utility which would increase its size. For
 * instance, adding htmlparser2 adds 125kb to the minified output file,
 * increasing its final size from 47kb to 172kb (at the time of writing). It
 * also doesn't work exactly correctly, treating the string "<3 blah blah blah"
 * as an HTML tag.
 *
 * Reference for HTML spec:
 *
 *     https://www.w3.org/TR/html51/syntax.html#sec-tokenization
 *
 * @param {String} html The HTML to parse
 * @param {Object} callbacks
 * @param {Function} callbacks.onOpenTag Callback function to call when an open
 *   tag is parsed. Called with the tagName as its argument.
 * @param {Function} callbacks.onCloseTag Callback function to call when a close
 *   tag is parsed. Called with the tagName as its argument. If a self-closing
 *   tag is found, `onCloseTag` is called immediately after `onOpenTag`.
 * @param {Function} callbacks.onText Callback function to call when text (i.e
 *   not an HTML tag) is parsed. Called with the text (string) as its first
 *   argument, and offset (number) into the string as its second.
 */
function parseHtml(html, _a) {
    var onOpenTag = _a.onOpenTag, onCloseTag = _a.onCloseTag, onText = _a.onText, onComment = _a.onComment, onDoctype = _a.onDoctype;
    var noCurrentTag = new CurrentTag();
    var charIdx = 0, len = html.length, state = 0 /* Data */, currentDataIdx = 0, // where the current data start index is
    currentTag = noCurrentTag; // describes the current tag that is being read
    // For debugging: search for other "For debugging" lines
    // const table = new CliTable( {
    // 	head: [ 'charIdx', 'char', 'state', 'currentDataIdx', 'currentOpenTagIdx', 'tag.type' ]
    // } );
    while (charIdx < len) {
        var char = html.charAt(charIdx);
        // For debugging: search for other "For debugging" lines
        // ALSO: Temporarily remove the 'const' keyword on the State enum
        // table.push(
        // 	[ charIdx, char, State[ state ], currentDataIdx, currentTag.idx, currentTag.idx === -1 ? '' : currentTag.type ]
        // );
        switch (state) {
            case 0 /* Data */:
                stateData(char);
                break;
            case 1 /* TagOpen */:
                stateTagOpen(char);
                break;
            case 2 /* EndTagOpen */:
                stateEndTagOpen(char);
                break;
            case 3 /* TagName */:
                stateTagName(char);
                break;
            case 4 /* BeforeAttributeName */:
                stateBeforeAttributeName(char);
                break;
            case 5 /* AttributeName */:
                stateAttributeName(char);
                break;
            case 6 /* AfterAttributeName */:
                stateAfterAttributeName(char);
                break;
            case 7 /* BeforeAttributeValue */:
                stateBeforeAttributeValue(char);
                break;
            case 8 /* AttributeValueDoubleQuoted */:
                stateAttributeValueDoubleQuoted(char);
                break;
            case 9 /* AttributeValueSingleQuoted */:
                stateAttributeValueSingleQuoted(char);
                break;
            case 10 /* AttributeValueUnquoted */:
                stateAttributeValueUnquoted(char);
                break;
            case 11 /* AfterAttributeValueQuoted */:
                stateAfterAttributeValueQuoted(char);
                break;
            case 12 /* SelfClosingStartTag */:
                stateSelfClosingStartTag(char);
                break;
            case 13 /* MarkupDeclarationOpenState */:
                stateMarkupDeclarationOpen(char);
                break;
            case 14 /* CommentStart */:
                stateCommentStart(char);
                break;
            case 15 /* CommentStartDash */:
                stateCommentStartDash(char);
                break;
            case 16 /* Comment */:
                stateComment(char);
                break;
            case 17 /* CommentEndDash */:
                stateCommentEndDash(char);
                break;
            case 18 /* CommentEnd */:
                stateCommentEnd(char);
                break;
            case 19 /* CommentEndBang */:
                stateCommentEndBang(char);
                break;
            case 20 /* Doctype */:
                stateDoctype(char);
                break;
            default:
                (0, utils_1.throwUnhandledCaseError)(state);
        }
        // For debugging: search for other "For debugging" lines
        // ALSO: Temporarily remove the 'const' keyword on the State enum
        // table.push(
        // 	[ charIdx, char, State[ state ], currentDataIdx, currentTag.idx, currentTag.idx === -1 ? '' : currentTag.type ]
        // );
        charIdx++;
    }
    if (currentDataIdx < charIdx) {
        emitText();
    }
    // For debugging: search for other "For debugging" lines
    // console.log( '\n' + table.toString() );
    // Called when non-tags are being read (i.e. the text around HTML †ags)
    // https://www.w3.org/TR/html51/syntax.html#data-state
    function stateData(char) {
        if (char === '<') {
            startNewTag();
        }
    }
    // Called after a '<' is read from the Data state
    // https://www.w3.org/TR/html51/syntax.html#tag-open-state
    function stateTagOpen(char) {
        if (char === '!') {
            state = 13 /* MarkupDeclarationOpenState */;
        }
        else if (char === '/') {
            state = 2 /* EndTagOpen */;
            currentTag = new CurrentTag((0, tslib_1.__assign)((0, tslib_1.__assign)({}, currentTag), { isClosing: true }));
        }
        else if (char === '<') {
            // start of another tag (ignore the previous, incomplete one)
            startNewTag();
        }
        else if (regex_lib_1.letterRe.test(char)) {
            // tag name start (and no '/' read)
            state = 3 /* TagName */;
            currentTag = new CurrentTag((0, tslib_1.__assign)((0, tslib_1.__assign)({}, currentTag), { isOpening: true }));
        }
        else {
            // Any other
            state = 0 /* Data */;
            currentTag = noCurrentTag;
        }
    }
    // After a '<x', '</x' sequence is read (where 'x' is a letter character),
    // this is to continue reading the tag name
    // https://www.w3.org/TR/html51/syntax.html#tag-name-state
    function stateTagName(char) {
        if (regex_lib_1.whitespaceRe.test(char)) {
            currentTag = new CurrentTag((0, tslib_1.__assign)((0, tslib_1.__assign)({}, currentTag), { name: captureTagName() }));
            state = 4 /* BeforeAttributeName */;
        }
        else if (char === '<') {
            // start of another tag (ignore the previous, incomplete one)
            startNewTag();
        }
        else if (char === '/') {
            currentTag = new CurrentTag((0, tslib_1.__assign)((0, tslib_1.__assign)({}, currentTag), { name: captureTagName() }));
            state = 12 /* SelfClosingStartTag */;
        }
        else if (char === '>') {
            currentTag = new CurrentTag((0, tslib_1.__assign)((0, tslib_1.__assign)({}, currentTag), { name: captureTagName() }));
            emitTagAndPreviousTextNode(); // resets to Data state as well
        }
        else if (!regex_lib_1.letterRe.test(char) && !regex_lib_1.digitRe.test(char) && char !== ':') {
            // Anything else that does not form an html tag. Note: the colon
            // character is accepted for XML namespaced tags
            resetToDataState();
        }
        else {
            // continue reading tag name
        }
    }
    // Called after the '/' is read from a '</' sequence
    // https://www.w3.org/TR/html51/syntax.html#end-tag-open-state
    function stateEndTagOpen(char) {
        if (char === '>') {
            // parse error. Encountered "</>". Skip it without treating as a tag
            resetToDataState();
        }
        else if (regex_lib_1.letterRe.test(char)) {
            state = 3 /* TagName */;
        }
        else {
            // some other non-tag-like character, don't treat this as a tag
            resetToDataState();
        }
    }
    // https://www.w3.org/TR/html51/syntax.html#before-attribute-name-state
    function stateBeforeAttributeName(char) {
        if (regex_lib_1.whitespaceRe.test(char)) {
            // stay in BeforeAttributeName state - continue reading chars
        }
        else if (char === '/') {
            state = 12 /* SelfClosingStartTag */;
        }
        else if (char === '>') {
            emitTagAndPreviousTextNode(); // resets to Data state as well
        }
        else if (char === '<') {
            // start of another tag (ignore the previous, incomplete one)
            startNewTag();
        }
        else if (char === "=" || regex_lib_1.quoteRe.test(char) || regex_lib_1.controlCharsRe.test(char)) {
            // "Parse error" characters that, according to the spec, should be
            // appended to the attribute name, but we'll treat these characters
            // as not forming a real HTML tag
            resetToDataState();
        }
        else {
            // Any other char, start of a new attribute name
            state = 5 /* AttributeName */;
        }
    }
    // https://www.w3.org/TR/html51/syntax.html#attribute-name-state
    function stateAttributeName(char) {
        if (regex_lib_1.whitespaceRe.test(char)) {
            state = 6 /* AfterAttributeName */;
        }
        else if (char === '/') {
            state = 12 /* SelfClosingStartTag */;
        }
        else if (char === '=') {
            state = 7 /* BeforeAttributeValue */;
        }
        else if (char === '>') {
            emitTagAndPreviousTextNode(); // resets to Data state as well
        }
        else if (char === '<') {
            // start of another tag (ignore the previous, incomplete one)
            startNewTag();
        }
        else if (regex_lib_1.quoteRe.test(char)) {
            // "Parse error" characters that, according to the spec, should be
            // appended to the attribute name, but we'll treat these characters
            // as not forming a real HTML tag
            resetToDataState();
        }
        else {
            // anything else: continue reading attribute name
        }
    }
    // https://www.w3.org/TR/html51/syntax.html#after-attribute-name-state
    function stateAfterAttributeName(char) {
        if (regex_lib_1.whitespaceRe.test(char)) {
            // ignore the character - continue reading
        }
        else if (char === '/') {
            state = 12 /* SelfClosingStartTag */;
        }
        else if (char === '=') {
            state = 7 /* BeforeAttributeValue */;
        }
        else if (char === '>') {
            emitTagAndPreviousTextNode();
        }
        else if (char === '<') {
            // start of another tag (ignore the previous, incomplete one)
            startNewTag();
        }
        else if (regex_lib_1.quoteRe.test(char)) {
            // "Parse error" characters that, according to the spec, should be
            // appended to the attribute name, but we'll treat these characters
            // as not forming a real HTML tag
            resetToDataState();
        }
        else {
            // Any other character, start a new attribute in the current tag
            state = 5 /* AttributeName */;
        }
    }
    // https://www.w3.org/TR/html51/syntax.html#before-attribute-value-state
    function stateBeforeAttributeValue(char) {
        if (regex_lib_1.whitespaceRe.test(char)) {
            // ignore the character - continue reading
        }
        else if (char === "\"") {
            state = 8 /* AttributeValueDoubleQuoted */;
        }
        else if (char === "'") {
            state = 9 /* AttributeValueSingleQuoted */;
        }
        else if (/[>=`]/.test(char)) {
            // Invalid chars after an '=' for an attribute value, don't count
            // the current tag as an HTML tag
            resetToDataState();
        }
        else if (char === '<') {
            // start of another tag (ignore the previous, incomplete one)
            startNewTag();
        }
        else {
            // Any other character, consider it an unquoted attribute value
            state = 10 /* AttributeValueUnquoted */;
        }
    }
    // https://www.w3.org/TR/html51/syntax.html#attribute-value-double-quoted-state
    function stateAttributeValueDoubleQuoted(char) {
        if (char === "\"") {
            // end the current double-quoted attribute
            state = 11 /* AfterAttributeValueQuoted */;
        }
        else {
            // consume the character as part of the double-quoted attribute value
        }
    }
    // https://www.w3.org/TR/html51/syntax.html#attribute-value-single-quoted-state
    function stateAttributeValueSingleQuoted(char) {
        if (char === "'") {
            // end the current single-quoted attribute
            state = 11 /* AfterAttributeValueQuoted */;
        }
        else {
            // consume the character as part of the double-quoted attribute value
        }
    }
    // https://www.w3.org/TR/html51/syntax.html#attribute-value-unquoted-state
    function stateAttributeValueUnquoted(char) {
        if (regex_lib_1.whitespaceRe.test(char)) {
            state = 4 /* BeforeAttributeName */;
        }
        else if (char === '>') {
            emitTagAndPreviousTextNode();
        }
        else if (char === '<') {
            // start of another tag (ignore the previous, incomplete one)
            startNewTag();
        }
        else {
            // Any other character, treat it as part of the attribute value
        }
    }
    // https://www.w3.org/TR/html51/syntax.html#after-attribute-value-quoted-state
    function stateAfterAttributeValueQuoted(char) {
        if (regex_lib_1.whitespaceRe.test(char)) {
            state = 4 /* BeforeAttributeName */;
        }
        else if (char === '/') {
            state = 12 /* SelfClosingStartTag */;
        }
        else if (char === '>') {
            emitTagAndPreviousTextNode();
        }
        else if (char === '<') {
            // start of another tag (ignore the previous, incomplete one)
            startNewTag();
        }
        else {
            // Any other character, "parse error". Spec says to switch to the
            // BeforeAttributeState and re-consume the character, as it may be
            // the start of a new attribute name
            state = 4 /* BeforeAttributeName */;
            reconsumeCurrentCharacter();
        }
    }
    // A '/' has just been read in the current tag (presumably for '/>'), and
    // this handles the next character
    // https://www.w3.org/TR/html51/syntax.html#self-closing-start-tag-state
    function stateSelfClosingStartTag(char) {
        if (char === '>') {
            currentTag = new CurrentTag((0, tslib_1.__assign)((0, tslib_1.__assign)({}, currentTag), { isClosing: true }));
            emitTagAndPreviousTextNode(); // resets to Data state as well
        }
        else {
            state = 4 /* BeforeAttributeName */;
        }
    }
    // https://www.w3.org/TR/html51/syntax.html#markup-declaration-open-state
    // (HTML Comments or !DOCTYPE)
    function stateMarkupDeclarationOpen(char) {
        if (html.substr(charIdx, 2) === '--') {
            // html comment
            charIdx += 2; // "consume" characters
            currentTag = new CurrentTag((0, tslib_1.__assign)((0, tslib_1.__assign)({}, currentTag), { type: 'comment' }));
            state = 14 /* CommentStart */;
        }
        else if (html.substr(charIdx, 7).toUpperCase() === 'DOCTYPE') {
            charIdx += 7; // "consume" characters
            currentTag = new CurrentTag((0, tslib_1.__assign)((0, tslib_1.__assign)({}, currentTag), { type: 'doctype' }));
            state = 20 /* Doctype */;
        }
        else {
            // At this point, the spec specifies that the state machine should
            // enter the "bogus comment" state, in which case any character(s)
            // after the '<!' that were read should become an HTML comment up
            // until the first '>' that is read (or EOF). Instead, we'll assume
            // that a user just typed '<!' as part of text data
            resetToDataState();
        }
    }
    // Handles after the sequence '<!--' has been read
    // https://www.w3.org/TR/html51/syntax.html#comment-start-state
    function stateCommentStart(char) {
        if (char === '-') {
            // We've read the sequence '<!---' at this point (3 dashes)
            state = 15 /* CommentStartDash */;
        }
        else if (char === '>') {
            // At this point, we'll assume the comment wasn't a real comment
            // so we'll just emit it as data. We basically read the sequence
            // '<!-->'
            resetToDataState();
        }
        else {
            // Any other char, take it as part of the comment
            state = 16 /* Comment */;
        }
    }
    // We've read the sequence '<!---' at this point (3 dashes)
    // https://www.w3.org/TR/html51/syntax.html#comment-start-dash-state
    function stateCommentStartDash(char) {
        if (char === '-') {
            // We've read '<!----' (4 dashes) at this point
            state = 18 /* CommentEnd */;
        }
        else if (char === '>') {
            // At this point, we'll assume the comment wasn't a real comment
            // so we'll just emit it as data. We basically read the sequence
            // '<!--->'
            resetToDataState();
        }
        else {
            // Anything else, take it as a valid comment
            state = 16 /* Comment */;
        }
    }
    // Currently reading the comment's text (data)
    // https://www.w3.org/TR/html51/syntax.html#comment-state
    function stateComment(char) {
        if (char === '-') {
            state = 17 /* CommentEndDash */;
        }
        else {
            // Any other character, stay in the Comment state
        }
    }
    // When we we've read the first dash inside a comment, it may signal the
    // end of the comment if we read another dash
    // https://www.w3.org/TR/html51/syntax.html#comment-end-dash-state
    function stateCommentEndDash(char) {
        if (char === '-') {
            state = 18 /* CommentEnd */;
        }
        else {
            // Wasn't a dash, must still be part of the comment
            state = 16 /* Comment */;
        }
    }
    // After we've read two dashes inside a comment, it may signal the end of
    // the comment if we then read a '>' char
    // https://www.w3.org/TR/html51/syntax.html#comment-end-state
    function stateCommentEnd(char) {
        if (char === '>') {
            emitTagAndPreviousTextNode();
        }
        else if (char === '!') {
            state = 19 /* CommentEndBang */;
        }
        else if (char === '-') {
            // A 3rd '-' has been read: stay in the CommentEnd state
        }
        else {
            // Anything else, switch back to the comment state since we didn't
            // read the full "end comment" sequence (i.e. '-->')
            state = 16 /* Comment */;
        }
    }
    // We've read the sequence '--!' inside of a comment
    // https://www.w3.org/TR/html51/syntax.html#comment-end-bang-state
    function stateCommentEndBang(char) {
        if (char === '-') {
            // We read the sequence '--!-' inside of a comment. The last dash
            // could signify that the comment is going to close
            state = 17 /* CommentEndDash */;
        }
        else if (char === '>') {
            // End of comment with the sequence '--!>'
            emitTagAndPreviousTextNode();
        }
        else {
            // The '--!' was not followed by a '>', continue reading the
            // comment's text
            state = 16 /* Comment */;
        }
    }
    /**
     * For DOCTYPES in particular, we don't care about the attributes. Just
     * advance to the '>' character and emit the tag, unless we find a '<'
     * character in which case we'll start a new tag.
     *
     * Example doctype tag:
     *    <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
     *
     * Actual spec: https://www.w3.org/TR/html51/syntax.html#doctype-state
     */
    function stateDoctype(char) {
        if (char === '>') {
            emitTagAndPreviousTextNode();
        }
        else if (char === '<') {
            startNewTag();
        }
        else {
            // stay in the Doctype state
        }
    }
    /**
     * Resets the state back to the Data state, and removes the current tag.
     *
     * We'll generally run this function whenever a "parse error" is
     * encountered, where the current tag that is being read no longer looks
     * like a real HTML tag.
     */
    function resetToDataState() {
        state = 0 /* Data */;
        currentTag = noCurrentTag;
    }
    /**
     * Starts a new HTML tag at the current index, ignoring any previous HTML
     * tag that was being read.
     *
     * We'll generally run this function whenever we read a new '<' character,
     * including when we read a '<' character inside of an HTML tag that we were
     * previously reading.
     */
    function startNewTag() {
        state = 1 /* TagOpen */;
        currentTag = new CurrentTag({ idx: charIdx });
    }
    /**
     * Once we've decided to emit an open tag, that means we can also emit the
     * text node before it.
     */
    function emitTagAndPreviousTextNode() {
        var textBeforeTag = html.slice(currentDataIdx, currentTag.idx);
        if (textBeforeTag) {
            // the html tag was the first element in the html string, or two
            // tags next to each other, in which case we should not emit a text
            // node
            onText(textBeforeTag, currentDataIdx);
        }
        if (currentTag.type === 'comment') {
            onComment(currentTag.idx);
        }
        else if (currentTag.type === 'doctype') {
            onDoctype(currentTag.idx);
        }
        else {
            if (currentTag.isOpening) {
                onOpenTag(currentTag.name, currentTag.idx);
            }
            if (currentTag.isClosing) {
                // note: self-closing tags will emit both opening and closing
                onCloseTag(currentTag.name, currentTag.idx);
            }
        }
        // Since we just emitted a tag, reset to the data state for the next char
        resetToDataState();
        currentDataIdx = charIdx + 1;
    }
    function emitText() {
        var text = html.slice(currentDataIdx, charIdx);
        onText(text, currentDataIdx);
        currentDataIdx = charIdx + 1;
    }
    /**
     * Captures the tag name from the start of the tag to the current character
     * index, and converts it to lower case
     */
    function captureTagName() {
        var startIdx = currentTag.idx + (currentTag.isClosing ? 2 : 1);
        return html.slice(startIdx, charIdx).toLowerCase();
    }
    /**
     * Causes the main loop to re-consume the current character, such as after
     * encountering a "parse error" that changed state and needs to reconsume
     * the same character in that new state.
     */
    function reconsumeCurrentCharacter() {
        charIdx--;
    }
}
exports.parseHtml = parseHtml;
var CurrentTag = /** @class */ (function () {
    function CurrentTag(cfg) {
        if (cfg === void 0) { cfg = {}; }
        this.idx = cfg.idx !== undefined ? cfg.idx : -1;
        this.type = cfg.type || 'tag';
        this.name = cfg.name || '';
        this.isOpening = !!cfg.isOpening;
        this.isClosing = !!cfg.isClosing;
    }
    return CurrentTag;
}());
//# sourceMappingURL=parse-html.js.map