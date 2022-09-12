"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnchorTagBuilder = void 0;
var html_tag_1 = require("./html-tag");
var truncate_smart_1 = require("./truncate/truncate-smart");
var truncate_middle_1 = require("./truncate/truncate-middle");
var truncate_end_1 = require("./truncate/truncate-end");
/**
 * @protected
 * @class Autolinker.AnchorTagBuilder
 * @extends Object
 *
 * Builds anchor (&lt;a&gt;) tags for the Autolinker utility when a match is
 * found.
 *
 * Normally this class is instantiated, configured, and used internally by an
 * {@link Autolinker} instance, but may actually be used indirectly in a
 * {@link Autolinker#replaceFn replaceFn} to create {@link Autolinker.HtmlTag HtmlTag}
 * instances which may be modified before returning from the
 * {@link Autolinker#replaceFn replaceFn}. For example:
 *
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( match ) {
 *             var tag = match.buildTag();  // returns an {@link Autolinker.HtmlTag} instance
 *             tag.setAttr( 'rel', 'nofollow' );
 *
 *             return tag;
 *         }
 *     } );
 *
 *     // generated html:
 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
 */
var AnchorTagBuilder = /** @class */ (function () {
    /**
     * @method constructor
     * @param {Object} [cfg] The configuration options for the AnchorTagBuilder instance, specified in an Object (map).
     */
    function AnchorTagBuilder(cfg) {
        if (cfg === void 0) { cfg = {}; }
        /**
         * @cfg {Boolean} newWindow
         * @inheritdoc Autolinker#newWindow
         */
        this.newWindow = false; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Object} truncate
         * @inheritdoc Autolinker#truncate
         */
        this.truncate = {}; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {String} className
         * @inheritdoc Autolinker#className
         */
        this.className = ''; // default value just to get the above doc comment in the ES5 output and documentation generator
        this.newWindow = cfg.newWindow || false;
        this.truncate = cfg.truncate || {};
        this.className = cfg.className || '';
    }
    /**
     * Generates the actual anchor (&lt;a&gt;) tag to use in place of the
     * matched text, via its `match` object.
     *
     * @param {Autolinker.match.Match} match The Match instance to generate an
     *   anchor tag from.
     * @return {Autolinker.HtmlTag} The HtmlTag instance for the anchor tag.
     */
    AnchorTagBuilder.prototype.build = function (match) {
        return new html_tag_1.HtmlTag({
            tagName: 'a',
            attrs: this.createAttrs(match),
            innerHtml: this.processAnchorText(match.getAnchorText()),
        });
    };
    /**
     * Creates the Object (map) of the HTML attributes for the anchor (&lt;a&gt;)
     *   tag being generated.
     *
     * @protected
     * @param {Autolinker.match.Match} match The Match instance to generate an
     *   anchor tag from.
     * @return {Object} A key/value Object (map) of the anchor tag's attributes.
     */
    AnchorTagBuilder.prototype.createAttrs = function (match) {
        var attrs = {
            href: match.getAnchorHref(), // we'll always have the `href` attribute
        };
        var cssClass = this.createCssClass(match);
        if (cssClass) {
            attrs['class'] = cssClass;
        }
        if (this.newWindow) {
            attrs['target'] = '_blank';
            attrs['rel'] = 'noopener noreferrer'; // Issue #149. See https://mathiasbynens.github.io/rel-noopener/
        }
        if (this.truncate) {
            if (this.truncate.length && this.truncate.length < match.getAnchorText().length) {
                attrs['title'] = match.getAnchorHref();
            }
        }
        return attrs;
    };
    /**
     * Creates the CSS class that will be used for a given anchor tag, based on
     * the `matchType` and the {@link #className} config.
     *
     * Example returns:
     *
     * - ""                                      // no {@link #className}
     * - "myLink myLink-url"                     // url match
     * - "myLink myLink-email"                   // email match
     * - "myLink myLink-phone"                   // phone match
     * - "myLink myLink-hashtag"                 // hashtag match
     * - "myLink myLink-mention myLink-twitter"  // mention match with Twitter service
     *
     * @protected
     * @param {Autolinker.match.Match} match The Match instance to generate an
     *   anchor tag from.
     * @return {String} The CSS class string for the link. Example return:
     *   "myLink myLink-url". If no {@link #className} was configured, returns
     *   an empty string.
     */
    AnchorTagBuilder.prototype.createCssClass = function (match) {
        var className = this.className;
        if (!className) {
            return '';
        }
        else {
            var returnClasses = [className], cssClassSuffixes = match.getCssClassSuffixes();
            for (var i = 0, len = cssClassSuffixes.length; i < len; i++) {
                returnClasses.push(className + '-' + cssClassSuffixes[i]);
            }
            return returnClasses.join(' ');
        }
    };
    /**
     * Processes the `anchorText` by truncating the text according to the
     * {@link #truncate} config.
     *
     * @private
     * @param {String} anchorText The anchor tag's text (i.e. what will be
     *   displayed).
     * @return {String} The processed `anchorText`.
     */
    AnchorTagBuilder.prototype.processAnchorText = function (anchorText) {
        anchorText = this.doTruncate(anchorText);
        return anchorText;
    };
    /**
     * Performs the truncation of the `anchorText` based on the {@link #truncate}
     * option. If the `anchorText` is longer than the length specified by the
     * {@link #truncate} option, the truncation is performed based on the
     * `location` property. See {@link #truncate} for details.
     *
     * @private
     * @param {String} anchorText The anchor tag's text (i.e. what will be
     *   displayed).
     * @return {String} The truncated anchor text.
     */
    AnchorTagBuilder.prototype.doTruncate = function (anchorText) {
        var truncate = this.truncate;
        if (!truncate || !truncate.length)
            return anchorText;
        var truncateLength = truncate.length, truncateLocation = truncate.location;
        if (truncateLocation === 'smart') {
            return (0, truncate_smart_1.truncateSmart)(anchorText, truncateLength);
        }
        else if (truncateLocation === 'middle') {
            return (0, truncate_middle_1.truncateMiddle)(anchorText, truncateLength);
        }
        else {
            return (0, truncate_end_1.truncateEnd)(anchorText, truncateLength);
        }
    };
    return AnchorTagBuilder;
}());
exports.AnchorTagBuilder = AnchorTagBuilder;
//# sourceMappingURL=anchor-tag-builder.js.map