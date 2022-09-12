"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlMatcher = void 0;
var tslib_1 = require("tslib");
var matcher_1 = require("./matcher");
var regex_lib_1 = require("../regex-lib");
var tld_regex_1 = require("./tld-regex");
var url_match_1 = require("../match/url-match");
var url_match_validator_1 = require("./url-match-validator");
// RegExp objects which are shared by all instances of UrlMatcher. These are
// here to avoid re-instantiating the RegExp objects if `Autolinker.link()` is
// called multiple times, thus instantiating UrlMatcher and its RegExp
// objects each time (which is very expensive - see https://github.com/gregjacobs/Autolinker.js/issues/314).
// See descriptions of the properties where they are used for details about them
// prettier-ignore
var matcherRegex = (function () {
    var schemeRegex = /(?:[A-Za-z][-.+A-Za-z0-9]{0,63}:(?![A-Za-z][-.+A-Za-z0-9]{0,63}:\/\/)(?!\d+\/?)(?:\/\/)?)/, // match protocol, allow in format "http://" or "mailto:". However, do not match the first part of something like 'link:http://www.google.com' (i.e. don't match "link:"). Also, make sure we don't interpret 'google.com:8000' as if 'google.com' was a protocol here (i.e. ignore a trailing port number in this regex)
    wwwRegex = /(?:www\.)/, // starting with 'www.'
    // Allow optional path, query string, and hash anchor, not ending in the following characters: "?!:,.;"
    // http://blog.codinghorror.com/the-problem-with-urls/
    urlSuffixRegex = new RegExp('[/?#](?:[' + regex_lib_1.alphaNumericAndMarksCharsStr + '\\-+&@#/%=~_()|\'$*\\[\\]{}?!:,.;^\u2713]*[' + regex_lib_1.alphaNumericAndMarksCharsStr + '\\-+&@#/%=~_()|\'$*\\[\\]{}\u2713])?');
    return new RegExp([
        '(?:',
        '(',
        schemeRegex.source,
        (0, regex_lib_1.getDomainNameStr)(2),
        ')',
        '|',
        '(',
        '(//)?',
        wwwRegex.source,
        (0, regex_lib_1.getDomainNameStr)(6),
        ')',
        '|',
        '(',
        '(//)?',
        (0, regex_lib_1.getDomainNameStr)(10) + '\\.',
        tld_regex_1.tldRegex.source,
        '(?![-' + regex_lib_1.alphaNumericCharsStr + '])',
        ')',
        ')',
        '(?::[0-9]+)?',
        '(?:' + urlSuffixRegex.source + ')?' // match for path, query string, and/or hash anchor - optional
    ].join(""), 'gi');
})();
var wordCharRegExp = new RegExp('[' + regex_lib_1.alphaNumericAndMarksCharsStr + ']');
/**
 * @class Autolinker.matcher.Url
 * @extends Autolinker.matcher.Matcher
 *
 * Matcher to find URL matches in an input string.
 *
 * See this class's superclass ({@link Autolinker.matcher.Matcher}) for more details.
 */
var UrlMatcher = /** @class */ (function (_super) {
    (0, tslib_1.__extends)(UrlMatcher, _super);
    /**
     * @method constructor
     * @param {Object} cfg The configuration properties for the Match instance,
     *   specified in an Object (map).
     */
    function UrlMatcher(cfg) {
        var _this = _super.call(this, cfg) || this;
        /**
         * @cfg {Object} stripPrefix (required)
         *
         * The Object form of {@link Autolinker#cfg-stripPrefix}.
         */
        _this.stripPrefix = {
            scheme: true,
            www: true,
        }; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Boolean} stripTrailingSlash (required)
         * @inheritdoc Autolinker#stripTrailingSlash
         */
        _this.stripTrailingSlash = true; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Boolean} decodePercentEncoding (required)
         * @inheritdoc Autolinker#decodePercentEncoding
         */
        _this.decodePercentEncoding = true; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @protected
         * @property {RegExp} matcherRegex
         *
         * The regular expression to match URLs with an optional scheme, port
         * number, path, query string, and hash anchor.
         *
         * Example matches:
         *
         *     http://google.com
         *     www.google.com
         *     google.com/path/to/file?q1=1&q2=2#myAnchor
         *
         *
         * This regular expression will have the following capturing groups:
         *
         * 1.  Group that matches a scheme-prefixed URL (i.e. 'http://google.com').
         *     This is used to match scheme URLs with just a single word, such as
         *     'http://localhost', where we won't double check that the domain name
         *     has at least one dot ('.') in it.
         * 2.  Group that matches a 'www.' prefixed URL. This is only matched if the
         *     'www.' text was not prefixed by a scheme (i.e.: not prefixed by
         *     'http://', 'ftp:', etc.)
         * 3.  A protocol-relative ('//') match for the case of a 'www.' prefixed
         *     URL. Will be an empty string if it is not a protocol-relative match.
         *     We need to know the character before the '//' in order to determine
         *     if it is a valid match or the // was in a string we don't want to
         *     auto-link.
         * 4.  Group that matches a known TLD (top level domain), when a scheme
         *     or 'www.'-prefixed domain is not matched.
         * 5.  A protocol-relative ('//') match for the case of a known TLD prefixed
         *     URL. Will be an empty string if it is not a protocol-relative match.
         *     See #3 for more info.
         */
        _this.matcherRegex = matcherRegex;
        /**
         * A regular expression to use to check the character before a protocol-relative
         * URL match. We don't want to match a protocol-relative URL if it is part
         * of another word.
         *
         * For example, we want to match something like "Go to: //google.com",
         * but we don't want to match something like "abc//google.com"
         *
         * This regular expression is used to test the character before the '//'.
         *
         * @protected
         * @type {RegExp} wordCharRegExp
         */
        _this.wordCharRegExp = wordCharRegExp;
        _this.stripPrefix = cfg.stripPrefix;
        _this.stripTrailingSlash = cfg.stripTrailingSlash;
        _this.decodePercentEncoding = cfg.decodePercentEncoding;
        return _this;
    }
    /**
     * @inheritdoc
     */
    UrlMatcher.prototype.parseMatches = function (text) {
        var matcherRegex = this.matcherRegex, stripPrefix = this.stripPrefix, stripTrailingSlash = this.stripTrailingSlash, decodePercentEncoding = this.decodePercentEncoding, tagBuilder = this.tagBuilder, matches = [], match;
        var _loop_1 = function () {
            var matchStr = match[0], schemeUrlMatch = match[1], wwwUrlMatch = match[4], wwwProtocolRelativeMatch = match[5], 
            //tldUrlMatch = match[ 8 ],  -- not needed at the moment
            tldProtocolRelativeMatch = match[9], offset = match.index, protocolRelativeMatch = wwwProtocolRelativeMatch || tldProtocolRelativeMatch, prevChar = text.charAt(offset - 1);
            if (!url_match_validator_1.UrlMatchValidator.isValid(matchStr, schemeUrlMatch)) {
                return "continue";
            }
            // If the match is preceded by an '@' character, then it is either
            // an email address or a username. Skip these types of matches.
            if (offset > 0 && prevChar === '@') {
                return "continue";
            }
            // If it's a protocol-relative '//' match, but the character before the '//'
            // was a word character (i.e. a letter/number), then we found the '//' in the
            // middle of another word (such as "asdf//asdf.com"). In this case, skip the
            // match.
            if (offset > 0 && protocolRelativeMatch && this_1.wordCharRegExp.test(prevChar)) {
                return "continue";
            }
            // If the URL ends with a question mark, don't include the question
            // mark as part of the URL. We'll assume the question mark was the
            // end of a sentence, such as: "Going to google.com?"
            if (/\?$/.test(matchStr)) {
                matchStr = matchStr.substr(0, matchStr.length - 1);
            }
            // Handle a closing parenthesis or square bracket at the end of the
            // match, and exclude it if there is not a matching open parenthesis
            // or square bracket in the match itself.
            if (this_1.matchHasUnbalancedClosingParen(matchStr)) {
                matchStr = matchStr.substr(0, matchStr.length - 1); // remove the trailing ")"
            }
            else {
                // Handle an invalid character after the TLD
                var pos = this_1.matchHasInvalidCharAfterTld(matchStr, schemeUrlMatch);
                if (pos > -1) {
                    matchStr = matchStr.substr(0, pos); // remove the trailing invalid chars
                }
            }
            // The autolinker accepts many characters in a url's scheme (like `fake://test.com`).
            // However, in cases where a URL is missing whitespace before an obvious link,
            // (for example: `nowhitespacehttp://www.test.com`), we only want the match to start
            // at the http:// part. We will check if the match contains a common scheme and then
            // shift the match to start from there.
            var foundCommonScheme = ['http://', 'https://'].find(function (commonScheme) { return !!schemeUrlMatch && schemeUrlMatch.indexOf(commonScheme) !== -1; });
            if (foundCommonScheme) {
                // If we found an overmatched URL, we want to find the index
                // of where the match should start and shift the match to
                // start from the beginning of the common scheme
                var indexOfSchemeStart = matchStr.indexOf(foundCommonScheme);
                matchStr = matchStr.substr(indexOfSchemeStart);
                schemeUrlMatch = schemeUrlMatch.substr(indexOfSchemeStart);
                offset = offset + indexOfSchemeStart;
            }
            var urlMatchType = schemeUrlMatch
                ? 'scheme'
                : wwwUrlMatch
                    ? 'www'
                    : 'tld', protocolUrlMatch = !!schemeUrlMatch;
            matches.push(new url_match_1.UrlMatch({
                tagBuilder: tagBuilder,
                matchedText: matchStr,
                offset: offset,
                urlMatchType: urlMatchType,
                url: matchStr,
                protocolUrlMatch: protocolUrlMatch,
                protocolRelativeMatch: !!protocolRelativeMatch,
                stripPrefix: stripPrefix,
                stripTrailingSlash: stripTrailingSlash,
                decodePercentEncoding: decodePercentEncoding,
            }));
        };
        var this_1 = this;
        while ((match = matcherRegex.exec(text)) !== null) {
            _loop_1();
        }
        return matches;
    };
    /**
     * Determines if a match found has an unmatched closing parenthesis,
     * square bracket or curly bracket. If so, the symbol will be removed
     * from the match itself, and appended after the generated anchor tag.
     *
     * A match may have an extra closing parenthesis at the end of the match
     * because the regular expression must include parenthesis for URLs such as
     * "wikipedia.com/something_(disambiguation)", which should be auto-linked.
     *
     * However, an extra parenthesis *will* be included when the URL itself is
     * wrapped in parenthesis, such as in the case of:
     *     "(wikipedia.com/something_(disambiguation))"
     * In this case, the last closing parenthesis should *not* be part of the
     * URL itself, and this method will return `true`.
     *
     * For square brackets in URLs such as in PHP arrays, the same behavior as
     * parenthesis discussed above should happen:
     *     "[http://www.example.com/foo.php?bar[]=1&bar[]=2&bar[]=3]"
     * The closing square bracket should not be part of the URL itself, and this
     * method will return `true`.
     *
     * @protected
     * @param {String} matchStr The full match string from the {@link #matcherRegex}.
     * @return {Boolean} `true` if there is an unbalanced closing parenthesis or
     *   square bracket at the end of the `matchStr`, `false` otherwise.
     */
    UrlMatcher.prototype.matchHasUnbalancedClosingParen = function (matchStr) {
        var endChar = matchStr.charAt(matchStr.length - 1);
        var startChar;
        if (endChar === ')') {
            startChar = '(';
        }
        else if (endChar === ']') {
            startChar = '[';
        }
        else if (endChar === '}') {
            startChar = '{';
        }
        else {
            return false; // not a close parenthesis or square bracket
        }
        // Find if there are the same number of open braces as close braces in
        // the URL string, minus the last character (which we have already
        // determined to be either ')', ']' or '}'
        var numOpenBraces = 0;
        for (var i = 0, len = matchStr.length - 1; i < len; i++) {
            var char = matchStr.charAt(i);
            if (char === startChar) {
                numOpenBraces++;
            }
            else if (char === endChar) {
                numOpenBraces = Math.max(numOpenBraces - 1, 0);
            }
        }
        // If the number of open braces matches the number of close braces in
        // the URL minus the last character, then the match has *unbalanced*
        // braces because of the last character. Example of unbalanced braces
        // from the regex match:
        //     "http://example.com?a[]=1]"
        if (numOpenBraces === 0) {
            return true;
        }
        return false;
    };
    /**
     * Determine if there's an invalid character after the TLD in a URL. Valid
     * characters after TLD are ':/?#'. Exclude scheme matched URLs from this
     * check.
     *
     * @protected
     * @param {String} urlMatch The matched URL, if there was one. Will be an
     *   empty string if the match is not a URL match.
     * @param {String} schemeUrlMatch The match URL string for a scheme
     *   match. Ex: 'http://yahoo.com'. This is used to match something like
     *   'http://localhost', where we won't double check that the domain name
     *   has at least one '.' in it.
     * @return {Number} the position where the invalid character was found. If
     *   no such character was found, returns -1
     */
    UrlMatcher.prototype.matchHasInvalidCharAfterTld = function (urlMatch, schemeUrlMatch) {
        if (!urlMatch) {
            return -1;
        }
        var offset = 0;
        if (schemeUrlMatch) {
            offset = urlMatch.indexOf(':');
            urlMatch = urlMatch.slice(offset);
        }
        // prettier-ignore
        var re = new RegExp("^((.?\/\/)?[-." + regex_lib_1.alphaNumericAndMarksCharsStr + "]*[-" + regex_lib_1.alphaNumericAndMarksCharsStr + "]\\.[-" + regex_lib_1.alphaNumericAndMarksCharsStr + "]+)");
        var res = re.exec(urlMatch);
        if (res === null) {
            return -1;
        }
        offset += res[1].length;
        urlMatch = urlMatch.slice(res[1].length);
        if (/^[^-.A-Za-z0-9:\/?#]/.test(urlMatch)) {
            return offset;
        }
        return -1;
    };
    return UrlMatcher;
}(matcher_1.Matcher));
exports.UrlMatcher = UrlMatcher;
//# sourceMappingURL=url-matcher.js.map