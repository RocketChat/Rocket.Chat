"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentionMatch = void 0;
var tslib_1 = require("tslib");
var match_1 = require("./match");
/**
 * @class Autolinker.match.Mention
 * @extends Autolinker.match.Match
 *
 * Represents a Mention match found in an input string which should be Autolinked.
 *
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */
var MentionMatch = /** @class */ (function (_super) {
    tslib_1.__extends(MentionMatch, _super);
    /**
     * @method constructor
     * @param {Object} cfg The configuration properties for the Match
     *   instance, specified in an Object (map).
     */
    function MentionMatch(cfg) {
        var _this = _super.call(this, cfg) || this;
        /**
         * @cfg {String} serviceName
         *
         * The service to point mention matches to. See {@link Autolinker#mention}
         * for available values.
         */
        _this.serviceName = 'twitter'; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {String} mention (required)
         *
         * The Mention that was matched, without the '@' character.
         */
        _this.mention = ''; // default value just to get the above doc comment in the ES5 output and documentation generator
        _this.mention = cfg.mention;
        _this.serviceName = cfg.serviceName;
        return _this;
    }
    /**
     * Returns a string name for the type of match that this class represents.
     * For the case of MentionMatch, returns 'mention'.
     *
     * @return {String}
     */
    MentionMatch.prototype.getType = function () {
        return 'mention';
    };
    /**
     * Returns the mention, without the '@' character.
     *
     * @return {String}
     */
    MentionMatch.prototype.getMention = function () {
        return this.mention;
    };
    /**
     * Returns the configured {@link #serviceName} to point the mention to.
     * Ex: 'instagram', 'twitter', 'soundcloud'.
     *
     * @return {String}
     */
    MentionMatch.prototype.getServiceName = function () {
        return this.serviceName;
    };
    /**
     * Returns the anchor href that should be generated for the match.
     *
     * @return {String}
     */
    MentionMatch.prototype.getAnchorHref = function () {
        switch (this.serviceName) {
            case 'twitter':
                return 'https://twitter.com/' + this.mention;
            case 'instagram':
                return 'https://instagram.com/' + this.mention;
            case 'soundcloud':
                return 'https://soundcloud.com/' + this.mention;
            default: // Shouldn't happen because Autolinker's constructor should block any invalid values, but just in case.
                throw new Error('Unknown service name to point mention to: ' + this.serviceName);
        }
    };
    /**
     * Returns the anchor text that should be generated for the match.
     *
     * @return {String}
     */
    MentionMatch.prototype.getAnchorText = function () {
        return '@' + this.mention;
    };
    /**
     * Returns the CSS class suffixes that should be used on a tag built with
     * the match. See {@link Autolinker.match.Match#getCssClassSuffixes} for
     * details.
     *
     * @return {String[]}
     */
    MentionMatch.prototype.getCssClassSuffixes = function () {
        var cssClassSuffixes = _super.prototype.getCssClassSuffixes.call(this), serviceName = this.getServiceName();
        if (serviceName) {
            cssClassSuffixes.push(serviceName);
        }
        return cssClassSuffixes;
    };
    return MentionMatch;
}(match_1.Match));
exports.MentionMatch = MentionMatch;

//# sourceMappingURL=mention-match.js.map
