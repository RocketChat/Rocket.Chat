"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneMatcher = void 0;
var tslib_1 = require("tslib");
var matcher_1 = require("./matcher");
var phone_match_1 = require("../match/phone-match");
var regex_lib_1 = require("../regex-lib");
// RegExp objects which are shared by all instances of PhoneMatcher. These are
// here to avoid re-instantiating the RegExp objects if `Autolinker.link()` is
// called multiple times, thus instantiating PhoneMatcher and its RegExp
// objects each time (which is very expensive - see https://github.com/gregjacobs/Autolinker.js/issues/314).
// See descriptions of the properties where they are used for details about them
// Over the years, many people have added to this regex, but it should have been
// split up by country. Maybe one day we can break this down.
var mostPhoneNumbers = /(?:(?:(?:(\+)?\d{1,3}[-\040.]?)?\(?\d{3}\)?[-\040.]?\d{3}[-\040.]?\d{4})|(?:(\+)(?:9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)[-\040.]?(?:\d[-\040.]?){6,12}\d+))([,;]+[0-9]+#?)*/;
// Regex for Japanese phone numbers
var japanesePhoneRe = /(0([1-9]{1}-?[1-9]\d{3}|[1-9]{2}-?\d{3}|[1-9]{2}\d{1}-?\d{2}|[1-9]{2}\d{2}-?\d{1})-?\d{4}|0[789]0-?\d{4}-?\d{4}|050-?\d{4}-?\d{4})/;
// Combined regex
var phoneMatcherRegex = new RegExp(mostPhoneNumbers.source + "|" + japanesePhoneRe.source, 'g');
/**
 * @class Autolinker.matcher.Phone
 * @extends Autolinker.matcher.Matcher
 *
 * Matcher to find Phone number matches in an input string.
 *
 * See this class's superclass ({@link Autolinker.matcher.Matcher}) for more
 * details.
 */
var PhoneMatcher = /** @class */ (function (_super) {
    tslib_1.__extends(PhoneMatcher, _super);
    function PhoneMatcher() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * The regular expression to match Phone numbers. Example matches:
         *
         *     (123) 456-7890
         *     123 456 7890
         *     123-456-7890
         *     +18004441234,,;,10226420346#
         *     +1 (800) 444 1234
         *     10226420346#
         *     1-800-444-1234,1022,64,20346#
         *
         * This regular expression has the following capturing groups:
         *
         * 1 or 2. The prefixed '+' sign, if there is one.
         *
         * @protected
         * @property {RegExp} matcherRegex
         */
        _this.matcherRegex = phoneMatcherRegex;
        return _this;
    }
    /**
     * @inheritdoc
     */
    PhoneMatcher.prototype.parseMatches = function (text) {
        var matcherRegex = this.matcherRegex, tagBuilder = this.tagBuilder, matches = [], match;
        while ((match = matcherRegex.exec(text)) !== null) {
            // Remove non-numeric values from phone number string
            var matchedText = match[0], cleanNumber = matchedText.replace(/[^0-9,;#]/g, ''), // strip out non-digit characters exclude comma semicolon and #
            plusSign = !!(match[1] || match[2]), // match[ 1 ] or match[ 2 ] is the prefixed plus sign, if there is one
            before = match.index == 0 ? '' : text.substr(match.index - 1, 1), after = text.substr(match.index + matchedText.length, 1), contextClear = !before.match(/\d/) && !after.match(/\d/);
            if (this.testMatch(match[3]) && this.testMatch(matchedText) && contextClear) {
                matches.push(new phone_match_1.PhoneMatch({
                    tagBuilder: tagBuilder,
                    matchedText: matchedText,
                    offset: match.index,
                    number: cleanNumber,
                    plusSign: plusSign
                }));
            }
        }
        return matches;
    };
    PhoneMatcher.prototype.testMatch = function (text) {
        return regex_lib_1.nonDigitRe.test(text);
    };
    return PhoneMatcher;
}(matcher_1.Matcher));
exports.PhoneMatcher = PhoneMatcher;

//# sourceMappingURL=phone-matcher.js.map
