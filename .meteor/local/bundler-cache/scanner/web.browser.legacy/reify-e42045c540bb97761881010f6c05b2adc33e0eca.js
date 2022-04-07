"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Matcher = void 0;
/**
 * @abstract
 * @class Autolinker.matcher.Matcher
 *
 * An abstract class and interface for individual matchers to find matches in
 * an input string with linkified versions of them.
 *
 * Note that Matchers do not take HTML into account - they must be fed the text
 * nodes of any HTML string, which is handled by {@link Autolinker#parse}.
 */
var Matcher = /** @class */ (function () {
    /**
     * @method constructor
     * @param {Object} cfg The configuration properties for the Matcher
     *   instance, specified in an Object (map).
     */
    function Matcher(cfg) {
        /**
         * @cfg {Autolinker.AnchorTagBuilder} tagBuilder (required)
         *
         * Reference to the AnchorTagBuilder instance to use to generate HTML tags
         * for {@link Autolinker.match.Match Matches}.
         */
        this.__jsduckDummyDocProp = null; // property used just to get the above doc comment into the ES5 output and documentation generator
        this.tagBuilder = cfg.tagBuilder;
    }
    return Matcher;
}());
exports.Matcher = Matcher;

//# sourceMappingURL=matcher.js.map
