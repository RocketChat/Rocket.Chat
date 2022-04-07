"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var anchor_tag_builder_1 = require("./anchor-tag-builder");
var match_1 = require("./match/match");
var email_match_1 = require("./match/email-match");
var hashtag_match_1 = require("./match/hashtag-match");
var mention_match_1 = require("./match/mention-match");
var phone_match_1 = require("./match/phone-match");
var url_match_1 = require("./match/url-match");
var matcher_1 = require("./matcher/matcher");
var html_tag_1 = require("./html-tag");
var email_matcher_1 = require("./matcher/email-matcher");
var url_matcher_1 = require("./matcher/url-matcher");
var hashtag_matcher_1 = require("./matcher/hashtag-matcher");
var phone_matcher_1 = require("./matcher/phone-matcher");
var mention_matcher_1 = require("./matcher/mention-matcher");
var parse_html_1 = require("./htmlParser/parse-html");
/**
 * @class Autolinker
 * @extends Object
 *
 * Utility class used to process a given string of text, and wrap the matches in
 * the appropriate anchor (&lt;a&gt;) tags to turn them into links.
 *
 * Any of the configuration options may be provided in an Object provided
 * to the Autolinker constructor, which will configure how the {@link #link link()}
 * method will process the links.
 *
 * For example:
 *
 *     var autolinker = new Autolinker( {
 *         newWindow : false,
 *         truncate  : 30
 *     } );
 *
 *     var html = autolinker.link( "Joe went to www.yahoo.com" );
 *     // produces: 'Joe went to <a href="http://www.yahoo.com">yahoo.com</a>'
 *
 *
 * The {@link #static-link static link()} method may also be used to inline
 * options into a single call, which may be more convenient for one-off uses.
 * For example:
 *
 *     var html = Autolinker.link( "Joe went to www.yahoo.com", {
 *         newWindow : false,
 *         truncate  : 30
 *     } );
 *     // produces: 'Joe went to <a href="http://www.yahoo.com">yahoo.com</a>'
 *
 *
 * ## Custom Replacements of Links
 *
 * If the configuration options do not provide enough flexibility, a {@link #replaceFn}
 * may be provided to fully customize the output of Autolinker. This function is
 * called once for each URL/Email/Phone#/Hashtag/Mention (Twitter, Instagram, Soundcloud)
 * match that is encountered.
 *
 * For example:
 *
 *     var input = "...";  // string with URLs, Email Addresses, Phone #s, Hashtags, and Mentions (Twitter, Instagram, Soundcloud)
 *
 *     var linkedText = Autolinker.link( input, {
 *         replaceFn : function( match ) {
 *             console.log( "href = ", match.getAnchorHref() );
 *             console.log( "text = ", match.getAnchorText() );
 *
 *             switch( match.getType() ) {
 *                 case 'url' :
 *                     console.log( "url: ", match.getUrl() );
 *
 *                     if( match.getUrl().indexOf( 'mysite.com' ) === -1 ) {
 *                         var tag = match.buildTag();  // returns an `Autolinker.HtmlTag` instance, which provides mutator methods for easy changes
 *                         tag.setAttr( 'rel', 'nofollow' );
 *                         tag.addClass( 'external-link' );
 *
 *                         return tag;
 *
 *                     } else {
 *                         return true;  // let Autolinker perform its normal anchor tag replacement
 *                     }
 *
 *                 case 'email' :
 *                     var email = match.getEmail();
 *                     console.log( "email: ", email );
 *
 *                     if( email === "my@own.address" ) {
 *                         return false;  // don't auto-link this particular email address; leave as-is
 *                     } else {
 *                         return;  // no return value will have Autolinker perform its normal anchor tag replacement (same as returning `true`)
 *                     }
 *
 *                 case 'phone' :
 *                     var phoneNumber = match.getPhoneNumber();
 *                     console.log( phoneNumber );
 *
 *                     return '<a href="http://newplace.to.link.phone.numbers.to/">' + phoneNumber + '</a>';
 *
 *                 case 'hashtag' :
 *                     var hashtag = match.getHashtag();
 *                     console.log( hashtag );
 *
 *                     return '<a href="http://newplace.to.link.hashtag.handles.to/">' + hashtag + '</a>';
 *
 *                 case 'mention' :
 *                     var mention = match.getMention();
 *                     console.log( mention );
 *
 *                     return '<a href="http://newplace.to.link.mention.to/">' + mention + '</a>';
 *             }
 *         }
 *     } );
 *
 *
 * The function may return the following values:
 *
 * - `true` (Boolean): Allow Autolinker to replace the match as it normally
 *   would.
 * - `false` (Boolean): Do not replace the current match at all - leave as-is.
 * - Any String: If a string is returned from the function, the string will be
 *   used directly as the replacement HTML for the match.
 * - An {@link Autolinker.HtmlTag} instance, which can be used to build/modify
 *   an HTML tag before writing out its HTML text.
 */
var Autolinker = /** @class */ (function () {
    /**
     * @method constructor
     * @param {Object} [cfg] The configuration options for the Autolinker instance,
     *   specified in an Object (map).
     */
    function Autolinker(cfg) {
        if (cfg === void 0) { cfg = {}; }
        /**
         * The Autolinker version number exposed on the instance itself.
         *
         * Ex: 0.25.1
         */
        this.version = Autolinker.version;
        /**
         * @cfg {Boolean/Object} [urls]
         *
         * `true` if URLs should be automatically linked, `false` if they should not
         * be. Defaults to `true`.
         *
         * Examples:
         *
         *     urls: true
         *
         *     // or
         *
         *     urls: {
         *         schemeMatches : true,
         *         wwwMatches    : true,
         *         tldMatches    : true
         *     }
         *
         * As shown above, this option also accepts an Object form with 3 properties
         * to allow for more customization of what exactly gets linked. All default
         * to `true`:
         *
         * @cfg {Boolean} [urls.schemeMatches] `true` to match URLs found prefixed
         *   with a scheme, i.e. `http://google.com`, or `other+scheme://google.com`,
         *   `false` to prevent these types of matches.
         * @cfg {Boolean} [urls.wwwMatches] `true` to match urls found prefixed with
         *   `'www.'`, i.e. `www.google.com`. `false` to prevent these types of
         *   matches. Note that if the URL had a prefixed scheme, and
         *   `schemeMatches` is true, it will still be linked.
         * @cfg {Boolean} [urls.tldMatches] `true` to match URLs with known top
         *   level domains (.com, .net, etc.) that are not prefixed with a scheme or
         *   `'www.'`. This option attempts to match anything that looks like a URL
         *   in the given text. Ex: `google.com`, `asdf.org/?page=1`, etc. `false`
         *   to prevent these types of matches.
         */
        this.urls = {}; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Boolean} [email=true]
         *
         * `true` if email addresses should be automatically linked, `false` if they
         * should not be.
         */
        this.email = true; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Boolean} [phone=true]
         *
         * `true` if Phone numbers ("(555)555-5555") should be automatically linked,
         * `false` if they should not be.
         */
        this.phone = true; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Boolean/String} [hashtag=false]
         *
         * A string for the service name to have hashtags (ex: "#myHashtag")
         * auto-linked to. The currently-supported values are:
         *
         * - 'twitter'
         * - 'facebook'
         * - 'instagram'
         *
         * Pass `false` to skip auto-linking of hashtags.
         */
        this.hashtag = false; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {String/Boolean} [mention=false]
         *
         * A string for the service name to have mentions (ex: "@myuser")
         * auto-linked to. The currently supported values are:
         *
         * - 'twitter'
         * - 'instagram'
         * - 'soundcloud'
         *
         * Defaults to `false` to skip auto-linking of mentions.
         */
        this.mention = false; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Boolean} [newWindow=true]
         *
         * `true` if the links should open in a new window, `false` otherwise.
         */
        this.newWindow = true; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Boolean/Object} [stripPrefix=true]
         *
         * `true` if 'http://' (or 'https://') and/or the 'www.' should be stripped
         * from the beginning of URL links' text, `false` otherwise. Defaults to
         * `true`.
         *
         * Examples:
         *
         *     stripPrefix: true
         *
         *     // or
         *
         *     stripPrefix: {
         *         scheme : true,
         *         www    : true
         *     }
         *
         * As shown above, this option also accepts an Object form with 2 properties
         * to allow for more customization of what exactly is prevented from being
         * displayed. Both default to `true`:
         *
         * @cfg {Boolean} [stripPrefix.scheme] `true` to prevent the scheme part of
         *   a URL match from being displayed to the user. Example:
         *   `'http://google.com'` will be displayed as `'google.com'`. `false` to
         *   not strip the scheme. NOTE: Only an `'http://'` or `'https://'` scheme
         *   will be removed, so as not to remove a potentially dangerous scheme
         *   (such as `'file://'` or `'javascript:'`)
         * @cfg {Boolean} [stripPrefix.www] www (Boolean): `true` to prevent the
         *   `'www.'` part of a URL match from being displayed to the user. Ex:
         *   `'www.google.com'` will be displayed as `'google.com'`. `false` to not
         *   strip the `'www'`.
         */
        this.stripPrefix = { scheme: true, www: true }; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Boolean} [stripTrailingSlash=true]
         *
         * `true` to remove the trailing slash from URL matches, `false` to keep
         *  the trailing slash.
         *
         *  Example when `true`: `http://google.com/` will be displayed as
         *  `http://google.com`.
         */
        this.stripTrailingSlash = true; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Boolean} [decodePercentEncoding=true]
         *
         * `true` to decode percent-encoded characters in URL matches, `false` to keep
         *  the percent-encoded characters.
         *
         *  Example when `true`: `https://en.wikipedia.org/wiki/San_Jos%C3%A9` will
         *  be displayed as `https://en.wikipedia.org/wiki/San_José`.
         */
        this.decodePercentEncoding = true; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Number/Object} [truncate=0]
         *
         * ## Number Form
         *
         * A number for how many characters matched text should be truncated to
         * inside the text of a link. If the matched text is over this number of
         * characters, it will be truncated to this length by adding a two period
         * ellipsis ('..') to the end of the string.
         *
         * For example: A url like 'http://www.yahoo.com/some/long/path/to/a/file'
         * truncated to 25 characters might look something like this:
         * 'yahoo.com/some/long/pat..'
         *
         * Example Usage:
         *
         *     truncate: 25
         *
         *
         *  Defaults to `0` for "no truncation."
         *
         *
         * ## Object Form
         *
         * An Object may also be provided with two properties: `length` (Number) and
         * `location` (String). `location` may be one of the following: 'end'
         * (default), 'middle', or 'smart'.
         *
         * Example Usage:
         *
         *     truncate: { length: 25, location: 'middle' }
         *
         * @cfg {Number} [truncate.length=0] How many characters to allow before
         *   truncation will occur. Defaults to `0` for "no truncation."
         * @cfg {"end"/"middle"/"smart"} [truncate.location="end"]
         *
         * - 'end' (default): will truncate up to the number of characters, and then
         *   add an ellipsis at the end. Ex: 'yahoo.com/some/long/pat..'
         * - 'middle': will truncate and add the ellipsis in the middle. Ex:
         *   'yahoo.com/s..th/to/a/file'
         * - 'smart': for URLs where the algorithm attempts to strip out unnecessary
         *   parts first (such as the 'www.', then URL scheme, hash, etc.),
         *   attempting to make the URL human-readable before looking for a good
         *   point to insert the ellipsis if it is still too long. Ex:
         *   'yahoo.com/some..to/a/file'. For more details, see
         *   {@link Autolinker.truncate.TruncateSmart}.
         */
        this.truncate = { length: 0, location: 'end' }; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {String} className
         *
         * A CSS class name to add to the generated links. This class will be added
         * to all links, as well as this class plus match suffixes for styling
         * url/email/phone/hashtag/mention links differently.
         *
         * For example, if this config is provided as "myLink", then:
         *
         * - URL links will have the CSS classes: "myLink myLink-url"
         * - Email links will have the CSS classes: "myLink myLink-email", and
         * - Phone links will have the CSS classes: "myLink myLink-phone"
         * - Hashtag links will have the CSS classes: "myLink myLink-hashtag"
         * - Mention links will have the CSS classes: "myLink myLink-mention myLink-[type]"
         *   where [type] is either "instagram", "twitter" or "soundcloud"
         */
        this.className = ''; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Function} replaceFn
         *
         * A function to individually process each match found in the input string.
         *
         * See the class's description for usage.
         *
         * The `replaceFn` can be called with a different context object (`this`
         * reference) using the {@link #context} cfg.
         *
         * This function is called with the following parameter:
         *
         * @cfg {Autolinker.match.Match} replaceFn.match The Match instance which
         *   can be used to retrieve information about the match that the `replaceFn`
         *   is currently processing. See {@link Autolinker.match.Match} subclasses
         *   for details.
         */
        this.replaceFn = null; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Object} context
         *
         * The context object (`this` reference) to call the `replaceFn` with.
         *
         * Defaults to this Autolinker instance.
         */
        this.context = undefined; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @cfg {Boolean} [sanitizeHtml=false]
         *
         * `true` to HTML-encode the start and end brackets of existing HTML tags found
         * in the input string. This will escape `<` and `>` characters to `&lt;` and
         * `&gt;`, respectively.
         *
         * Setting this to `true` will prevent XSS (Cross-site Scripting) attacks,
         * but will remove the significance of existing HTML tags in the input string. If
         * you would like to maintain the significance of existing HTML tags while also
         * making the output HTML string safe, leave this option as `false` and use a
         * tool like https://github.com/cure53/DOMPurify (or others) on the input string
         * before running Autolinker.
         */
        this.sanitizeHtml = false; // default value just to get the above doc comment in the ES5 output and documentation generator
        /**
         * @private
         * @property {Autolinker.matcher.Matcher[]} matchers
         *
         * The {@link Autolinker.matcher.Matcher} instances for this Autolinker
         * instance.
         *
         * This is lazily created in {@link #getMatchers}.
         */
        this.matchers = null;
        /**
         * @private
         * @property {Autolinker.AnchorTagBuilder} tagBuilder
         *
         * The AnchorTagBuilder instance used to build match replacement anchor tags.
         * Note: this is lazily instantiated in the {@link #getTagBuilder} method.
         */
        this.tagBuilder = null;
        // Note: when `this.something` is used in the rhs of these assignments,
        //       it refers to the default values set above the constructor
        this.urls = this.normalizeUrlsCfg(cfg.urls);
        this.email = typeof cfg.email === 'boolean' ? cfg.email : this.email;
        this.phone = typeof cfg.phone === 'boolean' ? cfg.phone : this.phone;
        this.hashtag = cfg.hashtag || this.hashtag;
        this.mention = cfg.mention || this.mention;
        this.newWindow = typeof cfg.newWindow === 'boolean' ? cfg.newWindow : this.newWindow;
        this.stripPrefix = this.normalizeStripPrefixCfg(cfg.stripPrefix);
        this.stripTrailingSlash = typeof cfg.stripTrailingSlash === 'boolean' ? cfg.stripTrailingSlash : this.stripTrailingSlash;
        this.decodePercentEncoding = typeof cfg.decodePercentEncoding === 'boolean' ? cfg.decodePercentEncoding : this.decodePercentEncoding;
        this.sanitizeHtml = cfg.sanitizeHtml || false;
        // Validate the value of the `mention` cfg
        var mention = this.mention;
        if (mention !== false && mention !== 'twitter' && mention !== 'instagram' && mention !== 'soundcloud') {
            throw new Error("invalid `mention` cfg - see docs");
        }
        // Validate the value of the `hashtag` cfg
        var hashtag = this.hashtag;
        if (hashtag !== false && hashtag !== 'twitter' && hashtag !== 'facebook' && hashtag !== 'instagram') {
            throw new Error("invalid `hashtag` cfg - see docs");
        }
        this.truncate = this.normalizeTruncateCfg(cfg.truncate);
        this.className = cfg.className || this.className;
        this.replaceFn = cfg.replaceFn || this.replaceFn;
        this.context = cfg.context || this;
    }
    /**
     * Automatically links URLs, Email addresses, Phone Numbers, Twitter handles,
     * Hashtags, and Mentions found in the given chunk of HTML. Does not link URLs
     * found within HTML tags.
     *
     * For instance, if given the text: `You should go to http://www.yahoo.com`,
     * then the result will be `You should go to &lt;a href="http://www.yahoo.com"&gt;http://www.yahoo.com&lt;/a&gt;`
     *
     * Example:
     *
     *     var linkedText = Autolinker.link( "Go to google.com", { newWindow: false } );
     *     // Produces: "Go to <a href="http://google.com">google.com</a>"
     *
     * @static
     * @param {String} textOrHtml The HTML or text to find matches within (depending
     *   on if the {@link #urls}, {@link #email}, {@link #phone}, {@link #mention},
     *   {@link #hashtag}, and {@link #mention} options are enabled).
     * @param {Object} [options] Any of the configuration options for the Autolinker
     *   class, specified in an Object (map). See the class description for an
     *   example call.
     * @return {String} The HTML text, with matches automatically linked.
     */
    Autolinker.link = function (textOrHtml, options) {
        var autolinker = new Autolinker(options);
        return autolinker.link(textOrHtml);
    };
    /**
     * Parses the input `textOrHtml` looking for URLs, email addresses, phone
     * numbers, username handles, and hashtags (depending on the configuration
     * of the Autolinker instance), and returns an array of {@link Autolinker.match.Match}
     * objects describing those matches (without making any replacements).
     *
     * Note that if parsing multiple pieces of text, it is slightly more efficient
     * to create an Autolinker instance, and use the instance-level {@link #parse}
     * method.
     *
     * Example:
     *
     *     var matches = Autolinker.parse( "Hello google.com, I am asdf@asdf.com", {
     *         urls: true,
     *         email: true
     *     } );
     *
     *     console.log( matches.length );           // 2
     *     console.log( matches[ 0 ].getType() );   // 'url'
     *     console.log( matches[ 0 ].getUrl() );    // 'google.com'
     *     console.log( matches[ 1 ].getType() );   // 'email'
     *     console.log( matches[ 1 ].getEmail() );  // 'asdf@asdf.com'
     *
     * @static
     * @param {String} textOrHtml The HTML or text to find matches within
     *   (depending on if the {@link #urls}, {@link #email}, {@link #phone},
     *   {@link #hashtag}, and {@link #mention} options are enabled).
     * @param {Object} [options] Any of the configuration options for the Autolinker
     *   class, specified in an Object (map). See the class description for an
     *   example call.
     * @return {Autolinker.match.Match[]} The array of Matches found in the
     *   given input `textOrHtml`.
     */
    Autolinker.parse = function (textOrHtml, options) {
        var autolinker = new Autolinker(options);
        return autolinker.parse(textOrHtml);
    };
    /**
     * Normalizes the {@link #urls} config into an Object with 3 properties:
     * `schemeMatches`, `wwwMatches`, and `tldMatches`, all Booleans.
     *
     * See {@link #urls} config for details.
     *
     * @private
     * @param {Boolean/Object} urls
     * @return {Object}
     */
    Autolinker.prototype.normalizeUrlsCfg = function (urls) {
        if (urls == null)
            urls = true; // default to `true`
        if (typeof urls === 'boolean') {
            return { schemeMatches: urls, wwwMatches: urls, tldMatches: urls };
        }
        else { // object form
            return {
                schemeMatches: typeof urls.schemeMatches === 'boolean' ? urls.schemeMatches : true,
                wwwMatches: typeof urls.wwwMatches === 'boolean' ? urls.wwwMatches : true,
                tldMatches: typeof urls.tldMatches === 'boolean' ? urls.tldMatches : true
            };
        }
    };
    /**
     * Normalizes the {@link #stripPrefix} config into an Object with 2
     * properties: `scheme`, and `www` - both Booleans.
     *
     * See {@link #stripPrefix} config for details.
     *
     * @private
     * @param {Boolean/Object} stripPrefix
     * @return {Object}
     */
    Autolinker.prototype.normalizeStripPrefixCfg = function (stripPrefix) {
        if (stripPrefix == null)
            stripPrefix = true; // default to `true`
        if (typeof stripPrefix === 'boolean') {
            return { scheme: stripPrefix, www: stripPrefix };
        }
        else { // object form
            return {
                scheme: typeof stripPrefix.scheme === 'boolean' ? stripPrefix.scheme : true,
                www: typeof stripPrefix.www === 'boolean' ? stripPrefix.www : true
            };
        }
    };
    /**
     * Normalizes the {@link #truncate} config into an Object with 2 properties:
     * `length` (Number), and `location` (String).
     *
     * See {@link #truncate} config for details.
     *
     * @private
     * @param {Number/Object} truncate
     * @return {Object}
     */
    Autolinker.prototype.normalizeTruncateCfg = function (truncate) {
        if (typeof truncate === 'number') {
            return { length: truncate, location: 'end' };
        }
        else { // object, or undefined/null
            return utils_1.defaults(truncate || {}, {
                length: Number.POSITIVE_INFINITY,
                location: 'end'
            });
        }
    };
    /**
     * Parses the input `textOrHtml` looking for URLs, email addresses, phone
     * numbers, username handles, and hashtags (depending on the configuration
     * of the Autolinker instance), and returns an array of {@link Autolinker.match.Match}
     * objects describing those matches (without making any replacements).
     *
     * This method is used by the {@link #link} method, but can also be used to
     * simply do parsing of the input in order to discover what kinds of links
     * there are and how many.
     *
     * Example usage:
     *
     *     var autolinker = new Autolinker( {
     *         urls: true,
     *         email: true
     *     } );
     *
     *     var matches = autolinker.parse( "Hello google.com, I am asdf@asdf.com" );
     *
     *     console.log( matches.length );           // 2
     *     console.log( matches[ 0 ].getType() );   // 'url'
     *     console.log( matches[ 0 ].getUrl() );    // 'google.com'
     *     console.log( matches[ 1 ].getType() );   // 'email'
     *     console.log( matches[ 1 ].getEmail() );  // 'asdf@asdf.com'
     *
     * @param {String} textOrHtml The HTML or text to find matches within
     *   (depending on if the {@link #urls}, {@link #email}, {@link #phone},
     *   {@link #hashtag}, and {@link #mention} options are enabled).
     * @return {Autolinker.match.Match[]} The array of Matches found in the
     *   given input `textOrHtml`.
     */
    Autolinker.prototype.parse = function (textOrHtml) {
        var _this = this;
        var skipTagNames = ['a', 'style', 'script'], skipTagsStackCount = 0, // used to only Autolink text outside of anchor/script/style tags. We don't want to autolink something that is already linked inside of an <a> tag, for instance
        matches = [];
        // Find all matches within the `textOrHtml` (but not matches that are
        // already nested within <a>, <style> and <script> tags)
        parse_html_1.parseHtml(textOrHtml, {
            onOpenTag: function (tagName) {
                if (skipTagNames.indexOf(tagName) >= 0) {
                    skipTagsStackCount++;
                }
            },
            onText: function (text, offset) {
                // Only process text nodes that are not within an <a>, <style> or <script> tag
                if (skipTagsStackCount === 0) {
                    // "Walk around" common HTML entities. An '&nbsp;' (for example)
                    // could be at the end of a URL, but we don't want to 
                    // include the trailing '&' in the URL. See issue #76
                    // TODO: Handle HTML entities separately in parseHtml() and
                    // don't emit them as "text" except for &amp; entities
                    var htmlCharacterEntitiesRegex = /(&nbsp;|&#160;|&lt;|&#60;|&gt;|&#62;|&quot;|&#34;|&#39;)/gi;
                    var textSplit = utils_1.splitAndCapture(text, htmlCharacterEntitiesRegex);
                    var currentOffset_1 = offset;
                    textSplit.forEach(function (splitText, i) {
                        // even number matches are text, odd numbers are html entities
                        if (i % 2 === 0) {
                            var textNodeMatches = _this.parseText(splitText, currentOffset_1);
                            matches.push.apply(matches, textNodeMatches);
                        }
                        currentOffset_1 += splitText.length;
                    });
                }
            },
            onCloseTag: function (tagName) {
                if (skipTagNames.indexOf(tagName) >= 0) {
                    skipTagsStackCount = Math.max(skipTagsStackCount - 1, 0); // attempt to handle extraneous </a> tags by making sure the stack count never goes below 0
                }
            },
            onComment: function (offset) { },
            onDoctype: function (offset) { }, // no need to process doctype nodes
        });
        // After we have found all matches, remove subsequent matches that
        // overlap with a previous match. This can happen for instance with URLs,
        // where the url 'google.com/#link' would match '#link' as a hashtag.
        matches = this.compactMatches(matches);
        // And finally, remove matches for match types that have been turned
        // off. We needed to have all match types turned on initially so that
        // things like hashtags could be filtered out if they were really just
        // part of a URL match (for instance, as a named anchor).
        matches = this.removeUnwantedMatches(matches);
        return matches;
    };
    /**
     * After we have found all matches, we need to remove matches that overlap
     * with a previous match. This can happen for instance with URLs, where the
     * url 'google.com/#link' would match '#link' as a hashtag. Because the
     * '#link' part is contained in a larger match that comes before the HashTag
     * match, we'll remove the HashTag match.
     *
     * @private
     * @param {Autolinker.match.Match[]} matches
     * @return {Autolinker.match.Match[]}
     */
    Autolinker.prototype.compactMatches = function (matches) {
        // First, the matches need to be sorted in order of offset
        matches.sort(function (a, b) { return a.getOffset() - b.getOffset(); });
        for (var i = 0; i < matches.length - 1; i++) {
            var match = matches[i], offset = match.getOffset(), matchedTextLength = match.getMatchedText().length, endIdx = offset + matchedTextLength;
            if (i + 1 < matches.length) {
                // Remove subsequent matches that equal offset with current match
                if (matches[i + 1].getOffset() === offset) {
                    var removeIdx = matches[i + 1].getMatchedText().length > matchedTextLength ? i : i + 1;
                    matches.splice(removeIdx, 1);
                    continue;
                }
                // Remove subsequent matches that overlap with the current match
                if (matches[i + 1].getOffset() < endIdx) {
                    matches.splice(i + 1, 1);
                }
            }
        }
        return matches;
    };
    /**
     * Removes matches for matchers that were turned off in the options. For
     * example, if {@link #hashtag hashtags} were not to be matched, we'll
     * remove them from the `matches` array here.
     *
     * Note: we *must* use all Matchers on the input string, and then filter
     * them out later. For example, if the options were `{ url: false, hashtag: true }`,
     * we wouldn't want to match the text '#link' as a HashTag inside of the text
     * 'google.com/#link'. The way the algorithm works is that we match the full
     * URL first (which prevents the accidental HashTag match), and then we'll
     * simply throw away the URL match.
     *
     * @private
     * @param {Autolinker.match.Match[]} matches The array of matches to remove
     *   the unwanted matches from. Note: this array is mutated for the
     *   removals.
     * @return {Autolinker.match.Match[]} The mutated input `matches` array.
     */
    Autolinker.prototype.removeUnwantedMatches = function (matches) {
        if (!this.hashtag)
            utils_1.remove(matches, function (match) { return match.getType() === 'hashtag'; });
        if (!this.email)
            utils_1.remove(matches, function (match) { return match.getType() === 'email'; });
        if (!this.phone)
            utils_1.remove(matches, function (match) { return match.getType() === 'phone'; });
        if (!this.mention)
            utils_1.remove(matches, function (match) { return match.getType() === 'mention'; });
        if (!this.urls.schemeMatches) {
            utils_1.remove(matches, function (m) { return m.getType() === 'url' && m.getUrlMatchType() === 'scheme'; });
        }
        if (!this.urls.wwwMatches) {
            utils_1.remove(matches, function (m) { return m.getType() === 'url' && m.getUrlMatchType() === 'www'; });
        }
        if (!this.urls.tldMatches) {
            utils_1.remove(matches, function (m) { return m.getType() === 'url' && m.getUrlMatchType() === 'tld'; });
        }
        return matches;
    };
    /**
     * Parses the input `text` looking for URLs, email addresses, phone
     * numbers, username handles, and hashtags (depending on the configuration
     * of the Autolinker instance), and returns an array of {@link Autolinker.match.Match}
     * objects describing those matches.
     *
     * This method processes a **non-HTML string**, and is used to parse and
     * match within the text nodes of an HTML string. This method is used
     * internally by {@link #parse}.
     *
     * @private
     * @param {String} text The text to find matches within (depending on if the
     *   {@link #urls}, {@link #email}, {@link #phone},
     *   {@link #hashtag}, and {@link #mention} options are enabled). This must be a non-HTML string.
     * @param {Number} [offset=0] The offset of the text node within the
     *   original string. This is used when parsing with the {@link #parse}
     *   method to generate correct offsets within the {@link Autolinker.match.Match}
     *   instances, but may be omitted if calling this method publicly.
     * @return {Autolinker.match.Match[]} The array of Matches found in the
     *   given input `text`.
     */
    Autolinker.prototype.parseText = function (text, offset) {
        if (offset === void 0) { offset = 0; }
        offset = offset || 0;
        var matchers = this.getMatchers(), matches = [];
        for (var i = 0, numMatchers = matchers.length; i < numMatchers; i++) {
            var textMatches = matchers[i].parseMatches(text);
            // Correct the offset of each of the matches. They are originally
            // the offset of the match within the provided text node, but we
            // need to correct them to be relative to the original HTML input
            // string (i.e. the one provided to #parse).
            for (var j = 0, numTextMatches = textMatches.length; j < numTextMatches; j++) {
                textMatches[j].setOffset(offset + textMatches[j].getOffset());
            }
            matches.push.apply(matches, textMatches);
        }
        return matches;
    };
    /**
     * Automatically links URLs, Email addresses, Phone numbers, Hashtags,
     * and Mentions (Twitter, Instagram, Soundcloud) found in the given chunk of HTML. Does not link
     * URLs found within HTML tags.
     *
     * For instance, if given the text: `You should go to http://www.yahoo.com`,
     * then the result will be `You should go to
     * &lt;a href="http://www.yahoo.com"&gt;http://www.yahoo.com&lt;/a&gt;`
     *
     * This method finds the text around any HTML elements in the input
     * `textOrHtml`, which will be the text that is processed. Any original HTML
     * elements will be left as-is, as well as the text that is already wrapped
     * in anchor (&lt;a&gt;) tags.
     *
     * @param {String} textOrHtml The HTML or text to autolink matches within
     *   (depending on if the {@link #urls}, {@link #email}, {@link #phone}, {@link #hashtag}, and {@link #mention} options are enabled).
     * @return {String} The HTML, with matches automatically linked.
     */
    Autolinker.prototype.link = function (textOrHtml) {
        if (!textOrHtml) {
            return "";
        } // handle `null` and `undefined` (for JavaScript users that don't have TypeScript support)
        /* We would want to sanitize the start and end characters of a tag
         * before processing the string in order to avoid an XSS scenario.
         * This behaviour can be changed by toggling the sanitizeHtml option.
         */
        if (this.sanitizeHtml) {
            textOrHtml = textOrHtml
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
        var matches = this.parse(textOrHtml), newHtml = [], lastIndex = 0;
        for (var i = 0, len = matches.length; i < len; i++) {
            var match = matches[i];
            newHtml.push(textOrHtml.substring(lastIndex, match.getOffset()));
            newHtml.push(this.createMatchReturnVal(match));
            lastIndex = match.getOffset() + match.getMatchedText().length;
        }
        newHtml.push(textOrHtml.substring(lastIndex)); // handle the text after the last match
        return newHtml.join('');
    };
    /**
     * Creates the return string value for a given match in the input string.
     *
     * This method handles the {@link #replaceFn}, if one was provided.
     *
     * @private
     * @param {Autolinker.match.Match} match The Match object that represents
     *   the match.
     * @return {String} The string that the `match` should be replaced with.
     *   This is usually the anchor tag string, but may be the `matchStr` itself
     *   if the match is not to be replaced.
     */
    Autolinker.prototype.createMatchReturnVal = function (match) {
        // Handle a custom `replaceFn` being provided
        var replaceFnResult;
        if (this.replaceFn) {
            replaceFnResult = this.replaceFn.call(this.context, match); // Autolinker instance is the context
        }
        if (typeof replaceFnResult === 'string') {
            return replaceFnResult; // `replaceFn` returned a string, use that
        }
        else if (replaceFnResult === false) {
            return match.getMatchedText(); // no replacement for the match
        }
        else if (replaceFnResult instanceof html_tag_1.HtmlTag) {
            return replaceFnResult.toAnchorString();
        }
        else { // replaceFnResult === true, or no/unknown return value from function
            // Perform Autolinker's default anchor tag generation
            var anchorTag = match.buildTag(); // returns an Autolinker.HtmlTag instance
            return anchorTag.toAnchorString();
        }
    };
    /**
     * Lazily instantiates and returns the {@link Autolinker.matcher.Matcher}
     * instances for this Autolinker instance.
     *
     * @private
     * @return {Autolinker.matcher.Matcher[]}
     */
    Autolinker.prototype.getMatchers = function () {
        if (!this.matchers) {
            var tagBuilder = this.getTagBuilder();
            var matchers = [
                new hashtag_matcher_1.HashtagMatcher({ tagBuilder: tagBuilder, serviceName: this.hashtag }),
                new email_matcher_1.EmailMatcher({ tagBuilder: tagBuilder }),
                new phone_matcher_1.PhoneMatcher({ tagBuilder: tagBuilder }),
                new mention_matcher_1.MentionMatcher({ tagBuilder: tagBuilder, serviceName: this.mention }),
                new url_matcher_1.UrlMatcher({ tagBuilder: tagBuilder, stripPrefix: this.stripPrefix, stripTrailingSlash: this.stripTrailingSlash, decodePercentEncoding: this.decodePercentEncoding })
            ];
            return (this.matchers = matchers);
        }
        else {
            return this.matchers;
        }
    };
    /**
     * Returns the {@link #tagBuilder} instance for this Autolinker instance,
     * lazily instantiating it if it does not yet exist.
     *
     * @private
     * @return {Autolinker.AnchorTagBuilder}
     */
    Autolinker.prototype.getTagBuilder = function () {
        var tagBuilder = this.tagBuilder;
        if (!tagBuilder) {
            tagBuilder = this.tagBuilder = new anchor_tag_builder_1.AnchorTagBuilder({
                newWindow: this.newWindow,
                truncate: this.truncate,
                className: this.className
            });
        }
        return tagBuilder;
    };
    /**
     * @static
     * @property {String} version
     *
     * The Autolinker version number in the form major.minor.patch
     *
     * Ex: 0.25.1
     */
    Autolinker.version = '3.14.3';
    /**
     * For backwards compatibility with Autolinker 1.x, the AnchorTagBuilder
     * class is provided as a static on the Autolinker class.
     */
    Autolinker.AnchorTagBuilder = anchor_tag_builder_1.AnchorTagBuilder;
    /**
     * For backwards compatibility with Autolinker 1.x, the HtmlTag class is
     * provided as a static on the Autolinker class.
     */
    Autolinker.HtmlTag = html_tag_1.HtmlTag;
    /**
     * For backwards compatibility with Autolinker 1.x, the Matcher classes are
     * provided as statics on the Autolinker class.
     */
    Autolinker.matcher = {
        Email: email_matcher_1.EmailMatcher,
        Hashtag: hashtag_matcher_1.HashtagMatcher,
        Matcher: matcher_1.Matcher,
        Mention: mention_matcher_1.MentionMatcher,
        Phone: phone_matcher_1.PhoneMatcher,
        Url: url_matcher_1.UrlMatcher
    };
    /**
     * For backwards compatibility with Autolinker 1.x, the Match classes are
     * provided as statics on the Autolinker class.
     */
    Autolinker.match = {
        Email: email_match_1.EmailMatch,
        Hashtag: hashtag_match_1.HashtagMatch,
        Match: match_1.Match,
        Mention: mention_match_1.MentionMatch,
        Phone: phone_match_1.PhoneMatch,
        Url: url_match_1.UrlMatch
    };
    return Autolinker;
}());
exports.default = Autolinker;

//# sourceMappingURL=autolinker.js.map
