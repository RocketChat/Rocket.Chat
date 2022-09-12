module.export({HashtagMatcher:()=>HashtagMatcher});let __extends;module.link("tslib",{__extends(v){__extends=v}},0);let Matcher;module.link('./matcher',{Matcher(v){Matcher=v}},1);let alphaNumericAndMarksCharsStr;module.link('../regex-lib',{alphaNumericAndMarksCharsStr(v){alphaNumericAndMarksCharsStr=v}},2);let HashtagMatch;module.link('../match/hashtag-match',{HashtagMatch(v){HashtagMatch=v}},3);



// RegExp objects which are shared by all instances of HashtagMatcher. These are
// here to avoid re-instantiating the RegExp objects if `Autolinker.link()` is
// called multiple times, thus instantiating HashtagMatcher and its RegExp
// objects each time (which is very expensive - see https://github.com/gregjacobs/Autolinker.js/issues/314).
// See descriptions of the properties where they are used for details about them
var matcherRegex = new RegExp("#[_".concat(alphaNumericAndMarksCharsStr, "]{1,139}(?![_").concat(alphaNumericAndMarksCharsStr, "])"), 'g'); // lookahead used to make sure we don't match something above 139 characters
var nonWordCharRegex = new RegExp('[^' + alphaNumericAndMarksCharsStr + ']');
/**
 * @class Autolinker.matcher.Hashtag
 * @extends Autolinker.matcher.Matcher
 *
 * Matcher to find HashtagMatch matches in an input string.
 */
var HashtagMatcher = /** @class */ (function (_super) {
    __extends(HashtagMatcher, _super);
    /**
     * @method constructor
     * @param {Object} cfg The configuration properties for the Match instance,
     *   specified in an Object (map).
     */
    function HashtagMatcher(cfg) {
        var _this = _super.call(this, cfg) || this;
        /**
         * @cfg {String} serviceName
         *
         * The service to point hashtag matches to. See {@link Autolinker#hashtag}
         * for available values.
         */
        _this.serviceName = 'twitter'; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * The regular expression to match Hashtags. Example match:
         *
         *     #asdf
         *
         * @protected
         * @property {RegExp} matcherRegex
         */
        _this.matcherRegex = matcherRegex;
        /**
         * The regular expression to use to check the character before a username match to
         * make sure we didn't accidentally match an email address.
         *
         * For example, the string "asdf@asdf.com" should not match "@asdf" as a username.
         *
         * @protected
         * @property {RegExp} nonWordCharRegex
         */
        _this.nonWordCharRegex = nonWordCharRegex;
        _this.serviceName = cfg.serviceName;
        return _this;
    }
    /**
     * @inheritdoc
     */
    HashtagMatcher.prototype.parseMatches = function (text) {
        var matcherRegex = this.matcherRegex, nonWordCharRegex = this.nonWordCharRegex, serviceName = this.serviceName, tagBuilder = this.tagBuilder, matches = [], match;
        while ((match = matcherRegex.exec(text)) !== null) {
            var offset = match.index, prevChar = text.charAt(offset - 1);
            // If we found the match at the beginning of the string, or we found the match
            // and there is a whitespace char in front of it (meaning it is not a '#' char
            // in the middle of a word), then it is a hashtag match.
            if (offset === 0 || nonWordCharRegex.test(prevChar)) {
                var matchedText = match[0], hashtag = match[0].slice(1); // strip off the '#' character at the beginning
                matches.push(new HashtagMatch({
                    tagBuilder: tagBuilder,
                    matchedText: matchedText,
                    offset: offset,
                    serviceName: serviceName,
                    hashtag: hashtag,
                }));
            }
        }
        return matches;
    };
    return HashtagMatcher;
}(Matcher));

//# sourceMappingURL=hashtag-matcher.js.map