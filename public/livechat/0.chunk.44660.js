(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{201:function(e,t,r){"use strict";
/*!
 * css-vars-ponyfill
 * v2.3.2
 * https://jhildenbiddle.github.io/css-vars-ponyfill/
 * (c) 2018-2020 John Hildenbiddle <http://hildenbiddle.com>
 * MIT license
 */
function n(){return(n=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(this,arguments)}function o(e){return function(e){if(Array.isArray(e))return a(e)}(e)||function(e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e))return Array.from(e)}(e)||function(e,t){if(!e)return;if("string"==typeof e)return a(e,t);var r=Object.prototype.toString.call(e).slice(8,-1);"Object"===r&&e.constructor&&(r=e.constructor.name);if("Map"===r||"Set"===r)return Array.from(e);if("Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return a(e,t)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}
/*!
 * get-css-data
 * v1.8.0
 * https://github.com/jhildenbiddle/get-css-data
 * (c) 2018-2020 John Hildenbiddle <http://hildenbiddle.com>
 * MIT license
 */()}function a(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=new Array(t);r<t;r++)n[r]=e[r];return n}function s(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r={mimeType:t.mimeType||null,onBeforeSend:t.onBeforeSend||Function.prototype,onSuccess:t.onSuccess||Function.prototype,onError:t.onError||Function.prototype,onComplete:t.onComplete||Function.prototype},n=Array.isArray(e)?e:[e],o=Array.apply(null,Array(n.length)).map((function(e){return null}));function a(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",t="<"===e.trim().charAt(0);return!t}function s(e,t){r.onError(e,n[t],t)}function c(e,t){var a=r.onSuccess(e,n[t],t);e=!1===a?"":a||e,o[t]=e,-1===o.indexOf(null)&&r.onComplete(o)}var i=document.createElement("a");n.forEach((function(e,t){if(i.setAttribute("href",e),i.href=String(i.href),Boolean(document.all&&!window.atob)&&i.host.split(":")[0]!==location.host.split(":")[0]){if(i.protocol===location.protocol){var n=new XDomainRequest;n.open("GET",e),n.timeout=0,n.onprogress=Function.prototype,n.ontimeout=Function.prototype,n.onload=function(){a(n.responseText)?c(n.responseText,t):s(n,t)},n.onerror=function(e){s(n,t)},setTimeout((function(){n.send()}),0)}else console.warn("Internet Explorer 9 Cross-Origin (CORS) requests must use the same protocol (".concat(e,")")),s(null,t)}else{var o=new XMLHttpRequest;o.open("GET",e),r.mimeType&&o.overrideMimeType&&o.overrideMimeType(r.mimeType),r.onBeforeSend(o,e,t),o.onreadystatechange=function(){4===o.readyState&&(200===o.status&&a(o.responseText)?c(o.responseText,t):s(o,t))},o.send()}}))}
/**
 * Gets CSS data from <style> and <link> nodes (including @imports), then
 * returns data in order processed by DOM. Allows specifying nodes to
 * include/exclude and filtering CSS data using RegEx.
 *
 * @preserve
 * @param {object}   [options] The options object
 * @param {object}   [options.rootElement=document] Root element to traverse for
 *                   <link> and <style> nodes.
 * @param {string}   [options.include] CSS selector matching <link> and <style>
 *                   nodes to include
 * @param {string}   [options.exclude] CSS selector matching <link> and <style>
 *                   nodes to exclude
 * @param {object}   [options.filter] Regular expression used to filter node CSS
 *                   data. Each block of CSS data is tested against the filter,
 *                   and only matching data is included.
 * @param {boolean}  [options.skipDisabled=true] Determines if disabled
 *                   stylesheets will be skipped while collecting CSS data.
 * @param {boolean}  [options.useCSSOM=false] Determines if CSS data will be
 *                   collected from a stylesheet's runtime values instead of its
 *                   text content. This is required to get accurate CSS data
 *                   when a stylesheet has been modified using the deleteRule()
 *                   or insertRule() methods because these modifications will
 *                   not be reflected in the stylesheet's text content.
 * @param {function} [options.onBeforeSend] Callback before XHR is sent. Passes
 *                   1) the XHR object, 2) source node reference, and 3) the
 *                   source URL as arguments.
 * @param {function} [options.onSuccess] Callback on each CSS node read. Passes
 *                   1) CSS text, 2) source node reference, and 3) the source
 *                   URL as arguments.
 * @param {function} [options.onError] Callback on each error. Passes 1) the XHR
 *                   object for inspection, 2) soure node reference, and 3) the
 *                   source URL that failed (either a <link> href or an @import)
 *                   as arguments
 * @param {function} [options.onComplete] Callback after all nodes have been
 *                   processed. Passes 1) concatenated CSS text, 2) an array of
 *                   CSS text in DOM order, and 3) an array of nodes in DOM
 *                   order as arguments.
 *
 * @example
 *
 *   getCssData({
 *     rootElement : document,
 *     include     : 'style,link[rel="stylesheet"]',
 *     exclude     : '[href="skip.css"]',
 *     filter      : /red/,
 *     skipDisabled: true,
 *     useCSSOM    : false,
 *     onBeforeSend(xhr, node, url) {
 *       // ...
 *     }
 *     onSuccess(cssText, node, url) {
 *       // ...
 *     }
 *     onError(xhr, node, url) {
 *       // ...
 *     },
 *     onComplete(cssText, cssArray, nodeArray) {
 *       // ...
 *     }
 *   });
 */function c(e){var t=/\/\*[\s\S]+?\*\//g,r=/(?:@import\s*)(?:url\(\s*)?(?:['"])([^'"]*)(?:['"])(?:\s*\))?(?:[^;]*;)/g,n={rootElement:e.rootElement||document,include:e.include||'style,link[rel="stylesheet"]',exclude:e.exclude||null,filter:e.filter||null,skipDisabled:!1!==e.skipDisabled,useCSSOM:e.useCSSOM||!1,onBeforeSend:e.onBeforeSend||Function.prototype,onSuccess:e.onSuccess||Function.prototype,onError:e.onError||Function.prototype,onComplete:e.onComplete||Function.prototype},o=Array.apply(null,n.rootElement.querySelectorAll(n.include)).filter((function(e){return t=e,r=n.exclude,!(t.matches||t.matchesSelector||t.webkitMatchesSelector||t.mozMatchesSelector||t.msMatchesSelector||t.oMatchesSelector).call(t,r);var t,r})),a=Array.apply(null,Array(o.length)).map((function(e){return null}));function c(){if(-1===a.indexOf(null)){var e=a.join("");n.onComplete(e,a,o)}}function u(e,t,r,o){var i=n.onSuccess(e,r,o);(function e(t,r,o,a){var c=arguments.length>4&&void 0!==arguments[4]?arguments[4]:[],i=arguments.length>5&&void 0!==arguments[5]?arguments[5]:[],u=l(t,o,i);u.rules.length?s(u.absoluteUrls,{onBeforeSend:function(e,t,o){n.onBeforeSend(e,r,t)},onSuccess:function(e,t,o){var a=n.onSuccess(e,r,t),s=l(e=!1===a?"":a||e,t,i);return s.rules.forEach((function(t,r){e=e.replace(t,s.absoluteRules[r])})),e},onError:function(n,s,l){c.push({xhr:n,url:s}),i.push(u.rules[l]),e(t,r,o,a,c,i)},onComplete:function(n){n.forEach((function(e,r){t=t.replace(u.rules[r],e)})),e(t,r,o,a,c,i)}}):a(t,c)})(e=void 0!==i&&!1===Boolean(i)?"":i||e,r,o,(function(e,o){null===a[t]&&(o.forEach((function(e){return n.onError(e.xhr,r,e.url)})),!n.filter||n.filter.test(e)?a[t]=e:a[t]="",c())}))}function l(e,n){var o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[],a={};return a.rules=(e.replace(t,"").match(r)||[]).filter((function(e){return-1===o.indexOf(e)})),a.urls=a.rules.map((function(e){return e.replace(r,"$1")})),a.absoluteUrls=a.urls.map((function(e){return i(e,n)})),a.absoluteRules=a.rules.map((function(e,t){var r=a.urls[t],o=i(a.absoluteUrls[t],n);return e.replace(r,o)})),a}o.length?o.forEach((function(e,t){var r=e.getAttribute("href"),o=e.getAttribute("rel"),l="LINK"===e.nodeName&&r&&o&&-1!==o.toLowerCase().indexOf("stylesheet"),f=!1!==n.skipDisabled&&e.disabled,d="STYLE"===e.nodeName;if(l&&!f)s(r,{mimeType:"text/css",onBeforeSend:function(t,r,o){n.onBeforeSend(t,e,r)},onSuccess:function(n,o,a){var s=i(r);u(n,t,e,s)},onError:function(r,o,s){a[t]="",n.onError(r,e,o),c()}});else if(d&&!f){var p=e.textContent;n.useCSSOM&&(p=Array.apply(null,e.sheet.cssRules).map((function(e){return e.cssText})).join("")),u(p,t,e,location.href)}else a[t]="",c()})):n.onComplete("",[])}function i(e,t){var r=document.implementation.createHTMLDocument(""),n=r.createElement("base"),o=r.createElement("a");return r.head.appendChild(n),r.body.appendChild(o),n.href=t||document.baseURI||(document.querySelector("base")||{}).href||location.href,o.href=e,o.href}r.r(t);var u=l;function l(e,t,r){e instanceof RegExp&&(e=f(e,r)),t instanceof RegExp&&(t=f(t,r));var n=d(e,t,r);return n&&{start:n[0],end:n[1],pre:r.slice(0,n[0]),body:r.slice(n[0]+e.length,n[1]),post:r.slice(n[1]+t.length)}}function f(e,t){var r=t.match(e);return r?r[0]:null}function d(e,t,r){var n,o,a,s,c,i=r.indexOf(e),u=r.indexOf(t,i+1),l=i;if(i>=0&&u>0){for(n=[],a=r.length;l>=0&&!c;)l==i?(n.push(l),i=r.indexOf(e,l+1)):1==n.length?c=[n.pop(),u]:((o=n.pop())<a&&(a=o,s=u),u=r.indexOf(t,l+1)),l=i<u&&i>=0?i:u;n.length&&(c=[a,s])}return c}function p(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r={preserveStatic:!0,removeComments:!1},o=n({},r,t),a=[];function s(e){throw new Error("CSS parse error: ".concat(e))}function c(t){var r=t.exec(e);if(r)return e=e.slice(r[0].length),r}function i(){return c(/^{\s*/)}function l(){return c(/^}/)}function f(){c(/^\s*/)}function d(){if(f(),"/"===e[0]&&"*"===e[1]){for(var t=2;e[t]&&("*"!==e[t]||"/"!==e[t+1]);)t++;if(!e[t])return s("end of comment is missing");var r=e.slice(2,t);return e=e.slice(t+2),{type:"comment",comment:r}}}function p(){for(var e,t=[];e=d();)t.push(e);return o.removeComments?[]:t}function m(){for(f();"}"===e[0];)s("extra closing bracket");var t=c(/^(("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^{])+)/);if(t)return t[0].trim().replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g,"").replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g,(function(e){return e.replace(/,/g,"‌")})).split(/\s*(?![^(]*\)),\s*/).map((function(e){return e.replace(/\u200C/g,",")}))}function v(){if("@"===e[0])return k();c(/^([;\s]*)+/);var t=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,r=c(/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);if(r){if(r=r[0].trim(),!c(/^:\s*/))return s("property missing ':'");var n=c(/^((?:\/\*.*?\*\/|'(?:\\'|.)*?'|"(?:\\"|.)*?"|\((\s*'(?:\\'|.)*?'|"(?:\\"|.)*?"|[^)]*?)\s*\)|[^};])+)/),o={type:"declaration",property:r.replace(t,""),value:n?n[0].replace(t,"").trim():""};return c(/^[;\s]*/),o}}function h(){if(!i())return s("missing '{'");for(var e,t=p();e=v();)t.push(e),t=t.concat(p());return l()?t:s("missing '}'")}function y(){f();for(var e,t=[];e=c(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/);)t.push(e[1]),c(/^,\s*/);if(t.length)return{type:"keyframe",values:t,declarations:h()}}function g(){var e=c(/^@([-\w]+)?keyframes\s*/);if(e){var t=e[1];if(!(e=c(/^([-\w]+)\s*/)))return s("@keyframes missing name");var r,n=e[1];if(!i())return s("@keyframes missing '{'");for(var o=p();r=y();)o.push(r),o=o.concat(p());return l()?{type:"keyframes",name:n,vendor:t,keyframes:o}:s("@keyframes missing '}'")}}function b(){if(c(/^@page */))return{type:"page",selectors:m()||[],declarations:h()}}function S(){var e=c(/@(top|bottom|left|right)-(left|center|right|top|middle|bottom)-?(corner)?\s*/);if(e)return{type:"page-margin-box",name:"".concat(e[1],"-").concat(e[2])+(e[3]?"-".concat(e[3]):""),declarations:h()}}function E(){if(c(/^@font-face\s*/))return{type:"font-face",declarations:h()}}function w(){var e=c(/^@supports *([^{]+)/);if(e)return{type:"supports",supports:e[1].trim(),rules:M()}}function C(){if(c(/^@host\s*/))return{type:"host",rules:M()}}function A(){var e=c(/^@media([^{]+)*/);if(e)return{type:"media",media:(e[1]||"").trim(),rules:M()}}function O(){var e=c(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);if(e)return{type:"custom-media",name:e[1].trim(),media:e[2].trim()}}function x(){var e=c(/^@([-\w]+)?document *([^{]+)/);if(e)return{type:"document",document:e[2].trim(),vendor:e[1]?e[1].trim():null,rules:M()}}function j(){var e=c(/^@(import|charset|namespace)\s*([^;]+);/);if(e)return{type:e[1],name:e[2].trim()}}function k(){if(f(),"@"===e[0]){var t=j()||E()||A()||g()||w()||x()||O()||C()||b()||S();if(t&&!o.preserveStatic){var r=!1;if(t.declarations)r=t.declarations.some((function(e){return/var\(/.test(e.value)}));else r=(t.keyframes||t.rules||[]).some((function(e){return(e.declarations||[]).some((function(e){return/var\(/.test(e.value)}))}));return r?t:{}}return t}}function _(){if(!o.preserveStatic){var t=u("{","}",e);if(t){var r=/:(?:root|host)(?![.:#(])/.test(t.pre)&&/--\S*\s*:/.test(t.body),n=/var\(/.test(t.body);if(!r&&!n)return e=e.slice(t.end+1),{}}}var a=m()||[],c=o.preserveStatic?h():h().filter((function(e){var t=a.some((function(e){return/:(?:root|host)(?![.:#(])/.test(e)}))&&/^--\S/.test(e.property),r=/var\(/.test(e.value);return t||r}));return a.length||s("selector missing"),{type:"rule",selectors:a,declarations:c}}function M(t){if(!t&&!i())return s("missing '{'");for(var r,n=p();e.length&&(t||"}"!==e[0])&&(r=k()||_());)r.type&&n.push(r),n=n.concat(p());return t||l()?n:s("missing '}'")}return{type:"stylesheet",stylesheet:{rules:M(!0),errors:a}}}function m(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r={parseHost:!1,store:{},onWarning:function(){}},o=n({},r,t),a=new RegExp(":".concat(o.parseHost?"host":"root","$"));return"string"==typeof e&&(e=p(e,o)),e.stylesheet.rules.forEach((function(e){"rule"===e.type&&e.selectors.some((function(e){return a.test(e)}))&&e.declarations.forEach((function(e,t){var r=e.property,n=e.value;r&&0===r.indexOf("--")&&(o.store[r]=n)}))})),o.store}function v(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",r=arguments.length>2?arguments[2]:void 0,n={charset:function(e){return"@charset "+e.name+";"},comment:function(e){return 0===e.comment.indexOf("__CSSVARSPONYFILL")?"/*"+e.comment+"*/":""},"custom-media":function(e){return"@custom-media "+e.name+" "+e.media+";"},declaration:function(e){return e.property+":"+e.value+";"},document:function(e){return"@"+(e.vendor||"")+"document "+e.document+"{"+o(e.rules)+"}"},"font-face":function(e){return"@font-face{"+o(e.declarations)+"}"},host:function(e){return"@host{"+o(e.rules)+"}"},import:function(e){return"@import "+e.name+";"},keyframe:function(e){return e.values.join(",")+"{"+o(e.declarations)+"}"},keyframes:function(e){return"@"+(e.vendor||"")+"keyframes "+e.name+"{"+o(e.keyframes)+"}"},media:function(e){return"@media "+e.media+"{"+o(e.rules)+"}"},namespace:function(e){return"@namespace "+e.name+";"},page:function(e){return"@page "+(e.selectors.length?e.selectors.join(", "):"")+"{"+o(e.declarations)+"}"},"page-margin-box":function(e){return"@"+e.name+"{"+o(e.declarations)+"}"},rule:function(e){var t=e.declarations;if(t.length)return e.selectors.join(",")+"{"+o(t)+"}"},supports:function(e){return"@supports "+e.supports+"{"+o(e.rules)+"}"}};function o(e){for(var o="",a=0;a<e.length;a++){var s=e[a];r&&r(s);var c=n[s.type](s);c&&(o+=c,c.length&&s.selectors&&(o+=t))}return o}return o(e.stylesheet.rules)}function h(e,t){e.rules.forEach((function(r){r.rules?h(r,t):r.keyframes?r.keyframes.forEach((function(e){"keyframe"===e.type&&t(e.declarations,r)})):r.declarations&&t(r.declarations,e)}))}l.range=d;function y(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r={preserveStatic:!0,preserveVars:!1,variables:{},onWarning:function(){}},o=n({},r,t);return"string"==typeof e&&(e=p(e,o)),h(e.stylesheet,(function(e,t){for(var r=0;r<e.length;r++){var n=e[r],a=n.type,s=n.property,c=n.value;if("declaration"===a)if(o.preserveVars||!s||0!==s.indexOf("--")){if(-1!==c.indexOf("var(")){var i=b(c,o);i!==n.value&&(i=g(i),o.preserveVars?(e.splice(r,0,{type:a,property:s,value:i}),r++):n.value=i)}}else e.splice(r,1),r--}})),v(e)}function g(e){return(e.match(/calc\(([^)]+)\)/g)||[]).forEach((function(t){var r="calc".concat(t.split("calc").join(""));e=e.replace(t,r)})),e}function b(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=arguments.length>2?arguments[2]:void 0;if(-1===e.indexOf("var("))return e;var n=u("(",")",e);function o(e){var n=e.split(",")[0].replace(/[\s\n\t]/g,""),o=(e.match(/(?:\s*,\s*){1}(.*)?/)||[])[1],a=Object.prototype.hasOwnProperty.call(t.variables,n)?String(t.variables[n]):void 0,s=a||(o?String(o):void 0),c=r||e;return a||t.onWarning('variable "'.concat(n,'" is undefined')),s&&"undefined"!==s&&s.length>0?b(s,t,c):"var(".concat(c,")")}if(n){if("var"===n.pre.slice(-3)){var a=0===n.body.trim().length;return a?(t.onWarning("var() must contain a non-whitespace string"),e):n.pre.slice(0,-3)+o(n.body)+b(n.post,t)}return n.pre+"(".concat(b(n.body,t),")")+b(n.post,t)}return-1!==e.indexOf("var(")&&t.onWarning('missing closing ")" in the value "'.concat(e,'"')),e}var S="undefined"!=typeof window,E=S&&window.CSS&&window.CSS.supports&&window.CSS.supports("(--a: 0)"),w={group:0,job:0},C={rootElement:S?document:null,shadowDOM:!1,include:"style,link[rel=stylesheet]",exclude:"",variables:{},onlyLegacy:!0,preserveStatic:!0,preserveVars:!1,silent:!1,updateDOM:!0,updateURLs:!0,watch:null,onBeforeSend:function(){},onError:function(){},onWarning:function(){},onSuccess:function(){},onComplete:function(){},onFinally:function(){}},A={cssComments:/\/\*[\s\S]+?\*\//g,cssKeyframes:/@(?:-\w*-)?keyframes/,cssMediaQueries:/@media[^{]+\{([\s\S]+?})\s*}/g,cssUrls:/url\((?!['"]?(?:data|http|\/\/):)['"]?([^'")]*)['"]?\)/g,cssVarDeclRules:/(?::(?:root|host)(?![.:#(])[\s,]*[^{]*{\s*[^}]*})/g,cssVarDecls:/(?:[\s;]*)(-{2}\w[\w-]*)(?:\s*:\s*)([^;]*);/g,cssVarFunc:/var\(\s*--[\w-]/,cssVars:/(?:(?::(?:root|host)(?![.:#(])[\s,]*[^{]*{\s*[^;]*;*\s*)|(?:var\(\s*))(--[^:)]+)(?:\s*[:)])/},O={dom:{},job:{},user:{}},x=!1,j=null,k=0,_=null,M=!1;
/**
 * Fetches, parses, and transforms CSS custom properties from specified
 * <style> and <link> elements into static values, then appends a new <style>
 * element with static values to the DOM to provide CSS custom property
 * compatibility for legacy browsers. Also provides a single interface for
 * live updates of runtime values in both modern and legacy browsers.
 *
 * @preserve
 * @param {object}   [options] Options object
 * @param {object}   [options.rootElement=document] Root element to traverse for
 *                   <link> and <style> nodes
 * @param {boolean}  [options.shadowDOM=false] Determines if shadow DOM <link>
 *                   and <style> nodes will be processed.
 * @param {string}   [options.include="style,link[rel=stylesheet]"] CSS selector
 *                   matching <link re="stylesheet"> and <style> nodes to
 *                   process
 * @param {string}   [options.exclude] CSS selector matching <link
 *                   rel="stylehseet"> and <style> nodes to exclude from those
 *                   matches by options.include
 * @param {object}   [options.variables] A map of custom property name/value
 *                   pairs. Property names can omit or include the leading
 *                   double-hyphen (—), and values specified will override
 *                   previous values
 * @param {boolean}  [options.onlyLegacy=true] Determines if the ponyfill will
 *                   only generate legacy-compatible CSS in browsers that lack
 *                   native support (i.e., legacy browsers)
 * @param {boolean}  [options.preserveStatic=true] Determines if CSS
 *                   declarations that do not reference a custom property will
 *                   be preserved in the transformed CSS
 * @param {boolean}  [options.preserveVars=false] Determines if CSS custom
 *                   property declarations will be preserved in the transformed
 *                   CSS
 * @param {boolean}  [options.silent=false] Determines if warning and error
 *                   messages will be displayed on the console
 * @param {boolean}  [options.updateDOM=true] Determines if the ponyfill will
 *                   update the DOM after processing CSS custom properties
 * @param {boolean}  [options.updateURLs=true] Determines if relative url()
 *                   paths will be converted to absolute urls in external CSS
 * @param {boolean}  [options.watch=false] Determines if a MutationObserver will
 *                   be created that will execute the ponyfill when a <link> or
 *                   <style> DOM mutation is observed
 * @param {function} [options.onBeforeSend] Callback before XHR is sent. Passes
 *                   1) the XHR object, 2) source node reference, and 3) the
 *                   source URL as arguments
 * @param {function} [options.onError] Callback after a CSS parsing error has
 *                   occurred or an XHR request has failed. Passes 1) an error
 *                   message, and 2) source node reference, 3) xhr, and 4 url as
 *                   arguments.
 * @param {function} [options.onWarning] Callback after each CSS parsing warning
 *                   has occurred. Passes 1) a warning message as an argument.
 * @param {function} [options.onSuccess] Callback after CSS data has been
 *                   collected from each node and before CSS custom properties
 *                   have been transformed. Allows modifying the CSS data before
 *                   it is transformed by returning any string value (or false
 *                   to skip). Passes 1) CSS text, 2) source node reference, and
 *                   3) the source URL as arguments.
 * @param {function} [options.onComplete] Callback after all CSS has been
 *                   processed, legacy-compatible CSS has been generated, and
 *                   (optionally) the DOM has been updated. Passes 1) a CSS
 *                   string with CSS variable values resolved, 2) an array of
 *                   output <style> node references that have been appended to
 *                   the DOM, 3) an object containing all custom properies names
 *                   and values, and 4) the ponyfill execution time in
 *                   milliseconds.
 * @param {function} [options.onFinally] Callback in modern and legacy browsers
 *                   after the ponyfill has finished all tasks. Passes 1) a
 *                   boolean indicating if the last ponyfill call resulted in a
 *                   style change, 2) a boolean indicating if the current
 *                   browser provides native support for CSS custom properties,
 *                   and 3) the ponyfill execution time in milliseconds.
 * @example
 *
 *   cssVars({
 *     rootElement   : document,
 *     shadowDOM     : false,
 *     include       : 'style,link[rel="stylesheet"]',
 *     exclude       : '',
 *     variables     : {},
 *     onlyLegacy    : true,
 *     preserveStatic: true,
 *     preserveVars  : false,
 *     silent        : false,
 *     updateDOM     : true,
 *     updateURLs    : true,
 *     watch         : false,
 *     onBeforeSend(xhr, node, url) {},
 *     onError(message, node, xhr, url) {},
 *     onWarning(message) {},
 *     onSuccess(cssText, node, url) {},
 *     onComplete(cssText, styleNode, cssVariables, benchmark) {},
 *     onFinally(hasChanged, hasNativeSupport, benchmark)
 *   });
 */
function T(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t="cssVars(): ",r=n({},C,e);function a(e,n,o,a){!r.silent&&window.console&&console.error("".concat(t).concat(e,"\n"),n),r.onError(e,n,o,a)}function s(e){!r.silent&&window.console&&console.warn("".concat(t).concat(e)),r.onWarning(e)}function i(e){r.onFinally(Boolean(e),E,F()-r.__benchmark)}if(S){if(r.watch)return r.watch=C.watch,L(r),void T(r);if(!1===r.watch&&j&&(j.disconnect(),j=null),!r.__benchmark){if(x===r.rootElement)return void R(e);if(r.__benchmark=F(),r.exclude=[j?'[data-cssvars]:not([data-cssvars=""])':'[data-cssvars="out"]',r.exclude].filter((function(e){return e})).join(","),r.variables=V(r.variables),!j){var u=Array.apply(null,r.rootElement.querySelectorAll('[data-cssvars="out"]'));if(u.forEach((function(e){var t=e.getAttribute("data-cssvars-group");(t?r.rootElement.querySelector('[data-cssvars="src"][data-cssvars-group="'.concat(t,'"]')):null)||e.parentNode.removeChild(e)})),k){var l=r.rootElement.querySelectorAll('[data-cssvars]:not([data-cssvars="out"])');l.length<k&&(k=l.length,O.dom={})}}}if("loading"!==document.readyState)if(E&&r.onlyLegacy){var f=!1;if(r.updateDOM){var d=r.rootElement.host||(r.rootElement===document?document.documentElement:r.rootElement);Object.keys(r.variables).forEach((function(e){var t=r.variables[e];f=f||t!==getComputedStyle(d).getPropertyValue(e),d.style.setProperty(e,t)}))}i(f)}else!M&&(r.shadowDOM||r.rootElement.shadowRoot||r.rootElement.host)?c({rootElement:C.rootElement,include:C.include,exclude:r.exclude,skipDisabled:!1,onSuccess:function(e,t,r){return(e=((e=e.replace(A.cssComments,"").replace(A.cssMediaQueries,"")).match(A.cssVarDeclRules)||[]).join(""))||!1},onComplete:function(e,t,n){m(e,{store:O.dom,onWarning:s}),M=!0,T(r)}}):(x=r.rootElement,c({rootElement:r.rootElement,include:r.include,exclude:r.exclude,skipDisabled:!1,onBeforeSend:r.onBeforeSend,onError:function(e,t,r){var n=e.responseURL||B(r,location.href),o=e.statusText?"(".concat(e.statusText,")"):"Unspecified Error"+(0===e.status?" (possibly CORS related)":"");a("CSS XHR Error: ".concat(n," ").concat(e.status," ").concat(o),t,e,n)},onSuccess:function(e,t,n){var o="LINK"===t.tagName,a="STYLE"===t.tagName&&e!==t.textContent,s=r.onSuccess(e,t,n);return e=void 0!==s&&!1===Boolean(s)?"":s||e,r.updateURLs&&(o||a)&&(e=N(e,n)),e},onComplete:function(e,t){var c=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[],u=n({},O.dom,O.user);if(O.job={},c.forEach((function(e,n){var o=t[n];if(A.cssVars.test(o))try{var c=p(o,{preserveStatic:r.preserveStatic,removeComments:!0});m(c,{parseHost:Boolean(r.rootElement.host),store:O.dom,onWarning:s}),e.__cssVars={tree:c}}catch(t){a(t.message,e)}})),n(O.job,O.dom),r.updateDOM?(n(O.user,r.variables),n(O.job,O.user)):(n(O.job,O.user,r.variables),n(u,r.variables)),w.job>0&&Boolean(Object.keys(O.job).length>Object.keys(u).length||Boolean(Object.keys(u).length&&Object.keys(O.job).some((function(e){return O.job[e]!==u[e]})))))q(r.rootElement),T(r);else{var l=[],f=[],d=!1;if(r.updateDOM&&w.job++,c.forEach((function(e,o){var c=!e.__cssVars;if(e.__cssVars)try{y(e.__cssVars.tree,n({},r,{variables:O.job,onWarning:s}));var i=v(e.__cssVars.tree);if(r.updateDOM){var u=t[o],p=A.cssVarFunc.test(u);if(e.getAttribute("data-cssvars")||e.setAttribute("data-cssvars","src"),i.length&&p){var m=e.getAttribute("data-cssvars-group")||++w.group,h=i.replace(/\s/g,""),g=r.rootElement.querySelector('[data-cssvars="out"][data-cssvars-group="'.concat(m,'"]'))||document.createElement("style");d=d||A.cssKeyframes.test(i),r.preserveStatic&&(e.sheet.disabled=!0),g.hasAttribute("data-cssvars")||g.setAttribute("data-cssvars","out"),h===e.textContent.replace(/\s/g,"")?(c=!0,g&&g.parentNode&&(e.removeAttribute("data-cssvars-group"),g.parentNode.removeChild(g))):h!==g.textContent.replace(/\s/g,"")&&([e,g].forEach((function(e){e.setAttribute("data-cssvars-job",w.job),e.setAttribute("data-cssvars-group",m)})),g.textContent=i,l.push(i),f.push(g),g.parentNode||e.parentNode.insertBefore(g,e.nextSibling))}}else e.textContent.replace(/\s/g,"")!==i&&l.push(i)}catch(t){a(t.message,e)}c&&e.setAttribute("data-cssvars","skip"),e.hasAttribute("data-cssvars-job")||e.setAttribute("data-cssvars-job",w.job)})),k=r.rootElement.querySelectorAll('[data-cssvars]:not([data-cssvars="out"])').length,r.shadowDOM)for(var h,g=[r.rootElement].concat(o(r.rootElement.querySelectorAll("*"))),b=0;h=g[b];++b)if(h.shadowRoot&&h.shadowRoot.querySelector("style")){var S=n({},r,{rootElement:h.shadowRoot});T(S)}r.updateDOM&&d&&D(r.rootElement),x=!1,r.onComplete(l.join(""),f,JSON.parse(JSON.stringify(O.job)),F()-r.__benchmark),i(f.length)}}}));else document.addEventListener("DOMContentLoaded",(function t(r){T(e),document.removeEventListener("DOMContentLoaded",t)}))}}function L(e){function t(e){var t=e.hasAttribute("disabled"),r=(e.sheet||{}).disabled;return t||r}function r(e){return"LINK"===e.tagName&&-1!==(e.getAttribute("rel")||"").indexOf("stylesheet")&&!t(e)}function n(e){return Array.apply(null,e).some((function(e){var n=1===e.nodeType&&e.hasAttribute("data-cssvars"),o=function(e){return"STYLE"===e.tagName&&!t(e)}(e)&&A.cssVars.test(e.textContent);return!n&&(r(e)||o)}))}window.MutationObserver&&(j&&(j.disconnect(),j=null),(j=new MutationObserver((function(t){t.some((function(t){var o,a=!1;return"attributes"===t.type?a=r(t.target):"childList"===t.type&&(a=n(t.addedNodes)||(o=t.removedNodes,Array.apply(null,o).some((function(t){var r=1===t.nodeType,n=r&&"out"===t.getAttribute("data-cssvars"),o=r&&"src"===t.getAttribute("data-cssvars"),a=o;if(o||n){var s=t.getAttribute("data-cssvars-group"),c=e.rootElement.querySelector('[data-cssvars-group="'.concat(s,'"]'));o&&(q(e.rootElement),O.dom={}),c&&c.parentNode.removeChild(c)}return a})))),a}))&&T(e)}))).observe(document.documentElement,{attributes:!0,attributeFilter:["disabled","href"],childList:!0,subtree:!0}))}function R(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:100;clearTimeout(_),_=setTimeout((function(){e.__benchmark=null,T(e)}),t)}function D(e){var t=["animation-name","-moz-animation-name","-webkit-animation-name"].filter((function(e){return getComputedStyle(document.body)[e]}))[0];if(t){for(var r=e.getElementsByTagName("*"),n=[],o=0,a=r.length;o<a;o++){var s=r[o];"none"!==getComputedStyle(s)[t]&&(s.style[t]+="__CSSVARSPONYFILL-KEYFRAMES__",n.push(s))}document.body.offsetHeight;for(var c=0,i=n.length;c<i;c++){var u=n[c].style;u[t]=u[t].replace("__CSSVARSPONYFILL-KEYFRAMES__","")}}}function N(e,t){return(e.replace(A.cssComments,"").match(A.cssUrls)||[]).forEach((function(r){var n=r.replace(A.cssUrls,"$1"),o=B(n,t);e=e.replace(r,r.replace(n,o))})),e}function V(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=/^-{2}/;return Object.keys(e).reduce((function(r,n){return r[t.test(n)?n:"--".concat(n.replace(/^-+/,""))]=e[n],r}),{})}function B(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:location.href,r=document.implementation.createHTMLDocument(""),n=r.createElement("base"),o=r.createElement("a");return r.head.appendChild(n),r.body.appendChild(o),n.href=t,o.href=e,o.href}function F(){return S&&(window.performance||{}).now?window.performance.now():(new Date).getTime()}function q(e){Array.apply(null,e.querySelectorAll('[data-cssvars="skip"],[data-cssvars="src"]')).forEach((function(e){return e.setAttribute("data-cssvars","")}))}T.reset=function(){for(var e in w.job=0,w.group=0,x=!1,j&&(j.disconnect(),j=null),k=0,_=null,M=!1,O)O[e]={}},t.default=T}}]);
//# sourceMappingURL=0.chunk.44660.js.map