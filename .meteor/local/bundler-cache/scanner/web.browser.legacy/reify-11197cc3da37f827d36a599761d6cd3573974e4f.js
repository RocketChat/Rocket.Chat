"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailMatcher = void 0;
var tslib_1 = require("tslib");
var matcher_1 = require("./matcher");
var regex_lib_1 = require("../regex-lib");
var email_match_1 = require("../match/email-match");
var utils_1 = require("../utils");
var tld_regex_1 = require("./tld-regex");
// For debugging: search for other "For debugging" lines
// import CliTable from 'cli-table';
// RegExp objects which are shared by all instances of EmailMatcher. These are
// here to avoid re-instantiating the RegExp objects if `Autolinker.link()` is
// called multiple times, thus instantiating EmailMatcher and its RegExp
// objects each time (which is very expensive - see https://github.com/gregjacobs/Autolinker.js/issues/314).
// See descriptions of the properties where they are used for details about them
var localPartCharRegex = new RegExp("[".concat(regex_lib_1.alphaNumericAndMarksCharsStr, "!#$%&'*+/=?^_`{|}~-]"));
var strictTldRegex = new RegExp("^".concat(tld_regex_1.tldRegex.source, "$"));
/**
 * @class Autolinker.matcher.Email
 * @extends Autolinker.matcher.Matcher
 *
 * Matcher to find email matches in an input string.
 *
 * See this class's superclass ({@link Autolinker.matcher.Matcher}) for more details.
 */
var EmailMatcher = /** @class */ (function (_super) {
    (0, tslib_1.__extends)(EmailMatcher, _super);
    function EmailMatcher() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Valid characters that can be used in the "local" part of an email address,
         * i.e. the "name" part of "name@site.com"
         */
        _this.localPartCharRegex = localPartCharRegex;
        /**
         * Stricter TLD regex which adds a beginning and end check to ensure
         * the string is a valid TLD
         */
        _this.strictTldRegex = strictTldRegex;
        return _this;
    }
    /**
     * @inheritdoc
     */
    EmailMatcher.prototype.parseMatches = function (text) {
        var tagBuilder = this.tagBuilder, localPartCharRegex = this.localPartCharRegex, strictTldRegex = this.strictTldRegex, matches = [], len = text.length, noCurrentEmailMatch = new CurrentEmailMatch();
        // for matching a 'mailto:' prefix
        var mailtoTransitions = {
            m: 'a',
            a: 'i',
            i: 'l',
            l: 't',
            t: 'o',
            o: ':',
        };
        var charIdx = 0, state = 0 /* NonEmailMatch */, currentEmailMatch = noCurrentEmailMatch;
        // For debugging: search for other "For debugging" lines
        // const table = new CliTable( {
        // 	head: [ 'charIdx', 'char', 'state', 'charIdx', 'currentEmailAddress.idx', 'hasDomainDot' ]
        // } );
        while (charIdx < len) {
            var char = text.charAt(charIdx);
            // For debugging: search for other "For debugging" lines
            // table.push(
            // 	[ charIdx, char, State[ state ], charIdx, currentEmailAddress.idx, currentEmailAddress.hasDomainDot ]
            // );
            switch (state) {
                case 0 /* NonEmailMatch */:
                    stateNonEmailAddress(char);
                    break;
                case 1 /* Mailto */:
                    stateMailTo(text.charAt(charIdx - 1), char);
                    break;
                case 2 /* LocalPart */:
                    stateLocalPart(char);
                    break;
                case 3 /* LocalPartDot */:
                    stateLocalPartDot(char);
                    break;
                case 4 /* AtSign */:
                    stateAtSign(char);
                    break;
                case 5 /* DomainChar */:
                    stateDomainChar(char);
                    break;
                case 6 /* DomainHyphen */:
                    stateDomainHyphen(char);
                    break;
                case 7 /* DomainDot */:
                    stateDomainDot(char);
                    break;
                default:
                    (0, utils_1.throwUnhandledCaseError)(state);
            }
            // For debugging: search for other "For debugging" lines
            // table.push(
            // 	[ charIdx, char, State[ state ], charIdx, currentEmailAddress.idx, currentEmailAddress.hasDomainDot ]
            // );
            charIdx++;
        }
        // Capture any valid match at the end of the string
        captureMatchIfValidAndReset();
        // For debugging: search for other "For debugging" lines
        //console.log( '\n' + table.toString() );
        return matches;
        // Handles the state when we're not in an email address
        function stateNonEmailAddress(char) {
            if (char === 'm') {
                beginEmailMatch(1 /* Mailto */);
            }
            else if (localPartCharRegex.test(char)) {
                beginEmailMatch();
            }
            else {
                // not an email address character, continue
            }
        }
        // Handles if we're reading a 'mailto:' prefix on the string
        function stateMailTo(prevChar, char) {
            if (prevChar === ':') {
                // We've reached the end of the 'mailto:' prefix
                if (localPartCharRegex.test(char)) {
                    state = 2 /* LocalPart */;
                    currentEmailMatch = new CurrentEmailMatch((0, tslib_1.__assign)((0, tslib_1.__assign)({}, currentEmailMatch), { hasMailtoPrefix: true }));
                }
                else {
                    // we've matched 'mailto:' but didn't get anything meaningful
                    // immediately afterwards (for example, we encountered a
                    // space character, or an '@' character which formed 'mailto:@'
                    resetToNonEmailMatchState();
                }
            }
            else if (mailtoTransitions[prevChar] === char) {
                // We're currently reading the 'mailto:' prefix, stay in
                // Mailto state
            }
            else if (localPartCharRegex.test(char)) {
                // We we're reading a prefix of 'mailto:', but encountered a
                // different character that didn't continue the prefix
                state = 2 /* LocalPart */;
            }
            else if (char === '.') {
                // We we're reading a prefix of 'mailto:', but encountered a
                // dot character
                state = 3 /* LocalPartDot */;
            }
            else if (char === '@') {
                // We we're reading a prefix of 'mailto:', but encountered a
                // an @ character
                state = 4 /* AtSign */;
            }
            else {
                // not an email address character, return to "NonEmailAddress" state
                resetToNonEmailMatchState();
            }
        }
        // Handles the state when we're currently in the "local part" of an
        // email address (as opposed to the "domain part")
        function stateLocalPart(char) {
            if (char === '.') {
                state = 3 /* LocalPartDot */;
            }
            else if (char === '@') {
                state = 4 /* AtSign */;
            }
            else if (localPartCharRegex.test(char)) {
                // stay in the "local part" of the email address
            }
            else {
                // not an email address character, return to "NonEmailAddress" state
                resetToNonEmailMatchState();
            }
        }
        // Handles the state where we've read
        function stateLocalPartDot(char) {
            if (char === '.') {
                // We read a second '.' in a row, not a valid email address
                // local part
                resetToNonEmailMatchState();
            }
            else if (char === '@') {
                // We read the '@' character immediately after a dot ('.'), not
                // an email address
                resetToNonEmailMatchState();
            }
            else if (localPartCharRegex.test(char)) {
                state = 2 /* LocalPart */;
            }
            else {
                // Anything else, not an email address
                resetToNonEmailMatchState();
            }
        }
        function stateAtSign(char) {
            if (regex_lib_1.domainNameCharRegex.test(char)) {
                state = 5 /* DomainChar */;
            }
            else {
                // Anything else, not an email address
                resetToNonEmailMatchState();
            }
        }
        function stateDomainChar(char) {
            if (char === '.') {
                state = 7 /* DomainDot */;
            }
            else if (char === '-') {
                state = 6 /* DomainHyphen */;
            }
            else if (regex_lib_1.domainNameCharRegex.test(char)) {
                // Stay in the DomainChar state
            }
            else {
                // Anything else, we potentially matched if the criteria has
                // been met
                captureMatchIfValidAndReset();
            }
        }
        function stateDomainHyphen(char) {
            if (char === '-' || char === '.') {
                // Not valid to have two hyphens ("--") or hypen+dot ("-.")
                captureMatchIfValidAndReset();
            }
            else if (regex_lib_1.domainNameCharRegex.test(char)) {
                state = 5 /* DomainChar */;
            }
            else {
                // Anything else
                captureMatchIfValidAndReset();
            }
        }
        function stateDomainDot(char) {
            if (char === '.' || char === '-') {
                // not valid to have two dots ("..") or dot+hypen (".-")
                captureMatchIfValidAndReset();
            }
            else if (regex_lib_1.domainNameCharRegex.test(char)) {
                state = 5 /* DomainChar */;
                // After having read a '.' and then a valid domain character,
                // we now know that the domain part of the email is valid, and
                // we have found at least a partial EmailMatch (however, the
                // email address may have additional characters from this point)
                currentEmailMatch = new CurrentEmailMatch((0, tslib_1.__assign)((0, tslib_1.__assign)({}, currentEmailMatch), { hasDomainDot: true }));
            }
            else {
                // Anything else
                captureMatchIfValidAndReset();
            }
        }
        function beginEmailMatch(newState) {
            if (newState === void 0) { newState = 2 /* LocalPart */; }
            state = newState;
            currentEmailMatch = new CurrentEmailMatch({ idx: charIdx });
        }
        function resetToNonEmailMatchState() {
            state = 0 /* NonEmailMatch */;
            currentEmailMatch = noCurrentEmailMatch;
        }
        /*
         * Captures the current email address as an EmailMatch if it's valid,
         * and resets the state to read another email address.
         */
        function captureMatchIfValidAndReset() {
            if (currentEmailMatch.hasDomainDot) {
                // we need at least one dot in the domain to be considered a valid email address
                var matchedText = text.slice(currentEmailMatch.idx, charIdx);
                // If we read a '.' or '-' char that ended the email address
                // (valid domain name characters, but only valid email address
                // characters if they are followed by something else), strip
                // it off now
                if (/[-.]$/.test(matchedText)) {
                    matchedText = matchedText.slice(0, -1);
                }
                var emailAddress = currentEmailMatch.hasMailtoPrefix
                    ? matchedText.slice('mailto:'.length)
                    : matchedText;
                // if the email address has a valid TLD, add it to the list of matches
                if (doesEmailHaveValidTld(emailAddress)) {
                    matches.push(new email_match_1.EmailMatch({
                        tagBuilder: tagBuilder,
                        matchedText: matchedText,
                        offset: currentEmailMatch.idx,
                        email: emailAddress,
                    }));
                }
            }
            resetToNonEmailMatchState();
            /**
             * Determines if the given email address has a valid TLD or not
             * @param {string} emailAddress - email address
             * @return {Boolean} - true is email have valid TLD, false otherwise
             */
            function doesEmailHaveValidTld(emailAddress) {
                var emailAddressTld = emailAddress.split('.').pop() || '';
                var emailAddressNormalized = emailAddressTld.toLowerCase();
                var isValidTld = strictTldRegex.test(emailAddressNormalized);
                return isValidTld;
            }
        }
    };
    return EmailMatcher;
}(matcher_1.Matcher));
exports.EmailMatcher = EmailMatcher;
var CurrentEmailMatch = /** @class */ (function () {
    function CurrentEmailMatch(cfg) {
        if (cfg === void 0) { cfg = {}; }
        this.idx = cfg.idx !== undefined ? cfg.idx : -1;
        this.hasMailtoPrefix = !!cfg.hasMailtoPrefix;
        this.hasDomainDot = !!cfg.hasDomainDot;
    }
    return CurrentEmailMatch;
}());
//# sourceMappingURL=email-matcher.js.map