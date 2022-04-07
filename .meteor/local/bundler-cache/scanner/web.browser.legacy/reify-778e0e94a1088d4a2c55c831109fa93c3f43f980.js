"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailMatch = void 0;
var tslib_1 = require("tslib");
var match_1 = require("./match");
/**
 * @class Autolinker.match.Email
 * @extends Autolinker.match.Match
 *
 * Represents a Email match found in an input string which should be Autolinked.
 *
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */
var EmailMatch = /** @class */ (function (_super) {
    tslib_1.__extends(EmailMatch, _super);
    /**
     * @method constructor
     * @param {Object} cfg The configuration properties for the Match
     *   instance, specified in an Object (map).
     */
    function EmailMatch(cfg) {
        var _this = _super.call(this, cfg) || this;
        /**
         * @cfg {String} email (required)
         *
         * The email address that was matched.
         */
        _this.email = ''; // default value just to get the above doc comment in the ES5 output and documentation generator
        _this.email = cfg.email;
        return _this;
    }
    /**
     * Returns a string name for the type of match that this class represents.
     * For the case of EmailMatch, returns 'email'.
     *
     * @return {String}
     */
    EmailMatch.prototype.getType = function () {
        return 'email';
    };
    /**
     * Returns the email address that was matched.
     *
     * @return {String}
     */
    EmailMatch.prototype.getEmail = function () {
        return this.email;
    };
    /**
     * Returns the anchor href that should be generated for the match.
     *
     * @return {String}
     */
    EmailMatch.prototype.getAnchorHref = function () {
        return 'mailto:' + this.email;
    };
    /**
     * Returns the anchor text that should be generated for the match.
     *
     * @return {String}
     */
    EmailMatch.prototype.getAnchorText = function () {
        return this.email;
    };
    return EmailMatch;
}(match_1.Match));
exports.EmailMatch = EmailMatch;

//# sourceMappingURL=email-match.js.map
