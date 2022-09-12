"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlTag = void 0;
var utils_1 = require("./utils");
/**
 * @class Autolinker.HtmlTag
 * @extends Object
 *
 * Represents an HTML tag, which can be used to easily build/modify HTML tags programmatically.
 *
 * Autolinker uses this abstraction to create HTML tags, and then write them out as strings. You may also use
 * this class in your code, especially within a {@link Autolinker#replaceFn replaceFn}.
 *
 * ## Examples
 *
 * Example instantiation:
 *
 *     var tag = new Autolinker.HtmlTag( {
 *         tagName : 'a',
 *         attrs   : { 'href': 'http://google.com', 'class': 'external-link' },
 *         innerHtml : 'Google'
 *     } );
 *
 *     tag.toAnchorString();  // <a href="http://google.com" class="external-link">Google</a>
 *
 *     // Individual accessor methods
 *     tag.getTagName();                 // 'a'
 *     tag.getAttr( 'href' );            // 'http://google.com'
 *     tag.hasClass( 'external-link' );  // true
 *
 *
 * Using mutator methods (which may be used in combination with instantiation config properties):
 *
 *     var tag = new Autolinker.HtmlTag();
 *     tag.setTagName( 'a' );
 *     tag.setAttr( 'href', 'http://google.com' );
 *     tag.addClass( 'external-link' );
 *     tag.setInnerHtml( 'Google' );
 *
 *     tag.getTagName();                 // 'a'
 *     tag.getAttr( 'href' );            // 'http://google.com'
 *     tag.hasClass( 'external-link' );  // true
 *
 *     tag.toAnchorString();  // <a href="http://google.com" class="external-link">Google</a>
 *
 *
 * ## Example use within a {@link Autolinker#replaceFn replaceFn}
 *
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( match ) {
 *             var tag = match.buildTag();  // returns an {@link Autolinker.HtmlTag} instance, configured with the Match's href and anchor text
 *             tag.setAttr( 'rel', 'nofollow' );
 *
 *             return tag;
 *         }
 *     } );
 *
 *     // generated html:
 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
 *
 *
 * ## Example use with a new tag for the replacement
 *
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( match ) {
 *             var tag = new Autolinker.HtmlTag( {
 *                 tagName : 'button',
 *                 attrs   : { 'title': 'Load URL: ' + match.getAnchorHref() },
 *                 innerHtml : 'Load URL: ' + match.getAnchorText()
 *             } );
 *
 *             return tag;
 *         }
 *     } );
 *
 *     // generated html:
 *     //   Test <button title="Load URL: http://google.com">Load URL: google.com</button>
 */
var HtmlTag = /** @class */ (function () {
    /**
     * @method constructor
     * @param {Object} [cfg] The configuration properties for this class, in an Object (map)
     */
    function HtmlTag(cfg) {
        if (cfg === void 0) { cfg = {}; }
        /**
         * @cfg {String} tagName
         *
         * The tag name. Ex: 'a', 'button', etc.
         *
         * Not required at instantiation time, but should be set using {@link #setTagName} before {@link #toAnchorString}
         * is executed.
         */
        this.tagName = ''; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Object.<String, String>} attrs
         *
         * An key/value Object (map) of attributes to create the tag with. The keys are the attribute names, and the
         * values are the attribute values.
         */
        this.attrs = {}; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {String} innerHTML
         *
         * The inner HTML for the tag.
         */
        this.innerHTML = ''; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @protected
         * @property {RegExp} whitespaceRegex
         *
         * Regular expression used to match whitespace in a string of CSS classes.
         */
        this.whitespaceRegex = /\s+/; // default value just to get the above doc comment in the ES5 output and documentation generator
        this.tagName = cfg.tagName || '';
        this.attrs = cfg.attrs || {};
        this.innerHTML = cfg.innerHtml || cfg.innerHTML || ''; // accept either the camelCased form or the fully capitalized acronym as in the DOM
    }
    /**
     * Sets the tag name that will be used to generate the tag with.
     *
     * @param {String} tagName
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */
    HtmlTag.prototype.setTagName = function (tagName) {
        this.tagName = tagName;
        return this;
    };
    /**
     * Retrieves the tag name.
     *
     * @return {String}
     */
    HtmlTag.prototype.getTagName = function () {
        return this.tagName || '';
    };
    /**
     * Sets an attribute on the HtmlTag.
     *
     * @param {String} attrName The attribute name to set.
     * @param {String} attrValue The attribute value to set.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */
    HtmlTag.prototype.setAttr = function (attrName, attrValue) {
        var tagAttrs = this.getAttrs();
        tagAttrs[attrName] = attrValue;
        return this;
    };
    /**
     * Retrieves an attribute from the HtmlTag. If the attribute does not exist, returns `undefined`.
     *
     * @param {String} attrName The attribute name to retrieve.
     * @return {String} The attribute's value, or `undefined` if it does not exist on the HtmlTag.
     */
    HtmlTag.prototype.getAttr = function (attrName) {
        return this.getAttrs()[attrName];
    };
    /**
     * Sets one or more attributes on the HtmlTag.
     *
     * @param {Object.<String, String>} attrs A key/value Object (map) of the attributes to set.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */
    HtmlTag.prototype.setAttrs = function (attrs) {
        Object.assign(this.getAttrs(), attrs);
        return this;
    };
    /**
     * Retrieves the attributes Object (map) for the HtmlTag.
     *
     * @return {Object.<String, String>} A key/value object of the attributes for the HtmlTag.
     */
    HtmlTag.prototype.getAttrs = function () {
        return this.attrs || (this.attrs = {});
    };
    /**
     * Sets the provided `cssClass`, overwriting any current CSS classes on the HtmlTag.
     *
     * @param {String} cssClass One or more space-separated CSS classes to set (overwrite).
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */
    HtmlTag.prototype.setClass = function (cssClass) {
        return this.setAttr('class', cssClass);
    };
    /**
     * Convenience method to add one or more CSS classes to the HtmlTag. Will not add duplicate CSS classes.
     *
     * @param {String} cssClass One or more space-separated CSS classes to add.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */
    HtmlTag.prototype.addClass = function (cssClass) {
        var classAttr = this.getClass(), whitespaceRegex = this.whitespaceRegex, classes = !classAttr ? [] : classAttr.split(whitespaceRegex), newClasses = cssClass.split(whitespaceRegex), newClass;
        while ((newClass = newClasses.shift())) {
            if ((0, utils_1.indexOf)(classes, newClass) === -1) {
                classes.push(newClass);
            }
        }
        this.getAttrs()['class'] = classes.join(' ');
        return this;
    };
    /**
     * Convenience method to remove one or more CSS classes from the HtmlTag.
     *
     * @param {String} cssClass One or more space-separated CSS classes to remove.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */
    HtmlTag.prototype.removeClass = function (cssClass) {
        var classAttr = this.getClass(), whitespaceRegex = this.whitespaceRegex, classes = !classAttr ? [] : classAttr.split(whitespaceRegex), removeClasses = cssClass.split(whitespaceRegex), removeClass;
        while (classes.length && (removeClass = removeClasses.shift())) {
            var idx = (0, utils_1.indexOf)(classes, removeClass);
            if (idx !== -1) {
                classes.splice(idx, 1);
            }
        }
        this.getAttrs()['class'] = classes.join(' ');
        return this;
    };
    /**
     * Convenience method to retrieve the CSS class(es) for the HtmlTag, which will each be separated by spaces when
     * there are multiple.
     *
     * @return {String}
     */
    HtmlTag.prototype.getClass = function () {
        return this.getAttrs()['class'] || '';
    };
    /**
     * Convenience method to check if the tag has a CSS class or not.
     *
     * @param {String} cssClass The CSS class to check for.
     * @return {Boolean} `true` if the HtmlTag has the CSS class, `false` otherwise.
     */
    HtmlTag.prototype.hasClass = function (cssClass) {
        return (' ' + this.getClass() + ' ').indexOf(' ' + cssClass + ' ') !== -1;
    };
    /**
     * Sets the inner HTML for the tag.
     *
     * @param {String} html The inner HTML to set.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */
    HtmlTag.prototype.setInnerHTML = function (html) {
        this.innerHTML = html;
        return this;
    };
    /**
     * Backwards compatibility method name.
     *
     * @param {String} html The inner HTML to set.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */
    HtmlTag.prototype.setInnerHtml = function (html) {
        return this.setInnerHTML(html);
    };
    /**
     * Retrieves the inner HTML for the tag.
     *
     * @return {String}
     */
    HtmlTag.prototype.getInnerHTML = function () {
        return this.innerHTML || '';
    };
    /**
     * Backward compatibility method name.
     *
     * @return {String}
     */
    HtmlTag.prototype.getInnerHtml = function () {
        return this.getInnerHTML();
    };
    /**
     * Override of superclass method used to generate the HTML string for the tag.
     *
     * @return {String}
     */
    HtmlTag.prototype.toAnchorString = function () {
        var tagName = this.getTagName(), attrsStr = this.buildAttrsStr();
        attrsStr = attrsStr ? ' ' + attrsStr : ''; // prepend a space if there are actually attributes
        return ['<', tagName, attrsStr, '>', this.getInnerHtml(), '</', tagName, '>'].join('');
    };
    /**
     * Support method for {@link #toAnchorString}, returns the string space-separated key="value" pairs, used to populate
     * the stringified HtmlTag.
     *
     * @protected
     * @return {String} Example return: `attr1="value1" attr2="value2"`
     */
    HtmlTag.prototype.buildAttrsStr = function () {
        if (!this.attrs)
            return ''; // no `attrs` Object (map) has been set, return empty string
        var attrs = this.getAttrs(), attrsArr = [];
        for (var prop in attrs) {
            if (attrs.hasOwnProperty(prop)) {
                attrsArr.push(prop + '="' + attrs[prop] + '"');
            }
        }
        return attrsArr.join(' ');
    };
    return HtmlTag;
}());
exports.HtmlTag = HtmlTag;
//# sourceMappingURL=html-tag.js.map