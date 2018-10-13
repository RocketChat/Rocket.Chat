/* eslint-disable */

'use strict';
(function() {
	var debounce = function debounce(func, wait, immediate) {
		var timeout = void 0;
		return function () {
			var _this = this;

			for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
				args[_key] = arguments[_key];
			}

			var later = function later() {
				timeout = null;
				!immediate && func.apply(_this, args);
			};

			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			callNow && func.apply(this, args);
		};
	};

	var cssVarPoly = {
		test: function test() {
			return window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)');
		},
		init: function init() {
			if (this.test()) {
				return;
			}

			console.time('cssVarPoly');
			cssVarPoly.ratifiedVars = {};
			cssVarPoly.varsByBlock = [];
			cssVarPoly.oldCSS = [];
			cssVarPoly.findCSS();
			cssVarPoly.updateCSS();
			console.timeEnd('cssVarPoly');
		},
		findCSS: function findCSS() {
			var styleBlocks = Array.prototype.concat.apply([], document.querySelectorAll('#css-variables, link[type="text/css"].__meteor-css__'));
			var counter = 1;
			styleBlocks.map(function (block) {
				if (block.nodeName === 'STYLE') {
					var theCSS = block.innerHTML;
					cssVarPoly.findSetters(theCSS, counter);
					cssVarPoly.oldCSS[counter++] = theCSS;
				} else if (block.nodeName === 'LINK') {
					var url = block.getAttribute('href');
					cssVarPoly.oldCSS[counter] = '';
					cssVarPoly.getLink(url, counter, function (counter, request) {
						cssVarPoly.findSetters(request.responseText, counter);
						cssVarPoly.oldCSS[counter++] = request.responseText;
						cssVarPoly.updateCSS();
					});
				}
			});
		},
		findSetters: function findSetters(theCSS, counter) {
			cssVarPoly.varsByBlock[counter] = theCSS.match(/(--[^:; ]+:..*?;)/g);
		},


		updateCSS: debounce(function () {
			cssVarPoly.ratifySetters(cssVarPoly.varsByBlock);
			cssVarPoly.oldCSS.filter(function (e) {
				return e;
			}).forEach(function (css, id) {
				var newCSS = cssVarPoly.replaceGetters(css, cssVarPoly.ratifiedVars);
				var el = document.querySelector('#inserted' + id);

				if (el) {
					el.innerHTML = newCSS;
				} else {
					var style = document.createElement('style');
					style.type = 'text/css';
					style.innerHTML = newCSS;
					style.classList.add('inserted');
					style.id = 'inserted' + id;
					document.getElementsByTagName('head')[0].appendChild(style);
				}
			});
		}, 100),

		replaceGetters: function replaceGetters(oldCSS, varList) {
			return oldCSS.replace(/var\((--.*?)\)/gm, function (all, variable) {
				return varList[variable];
			});
		},
		ratifySetters: function ratifySetters(varList) {
			varList.filter(function (curVars) {
				return curVars;
			}).forEach(function (curVars) {
				curVars.forEach(function (theVar) {
					var matches = theVar.split(/:\s*/);
					cssVarPoly.ratifiedVars[matches[0]] = matches[1].replace(/;/, '');
				});
			});
			Object.keys(cssVarPoly.ratifiedVars).filter(function (key) {
				return cssVarPoly.ratifiedVars[key].indexOf('var') > -1;
			}).forEach(function (key) {
				cssVarPoly.ratifiedVars[key] = cssVarPoly.ratifiedVars[key].replace(/var\((--.*?)\)/gm, function (all, variable) {
					return cssVarPoly.ratifiedVars[variable];
				});
			});
		},
		getLink: function getLink(url, counter, success) {
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.overrideMimeType('text/css;');

			request.onload = function () {
				if (request.status >= 200 && request.status < 400) {
					if (typeof success === 'function') {
						success(counter, request);
					}
				} else {
					console.warn('an error was returned from:', url);
				}
			};

			request.onerror = function () {
				console.warn('we could not get anything from:', url);
			};

			request.send();
		}
	};
	var stateCheck = setInterval(function () {
		if (document.readyState === 'complete' && typeof Meteor !== 'undefined') {
			clearInterval(stateCheck);
			cssVarPoly.init();
		}
	}, 100);

	var DynamicCss = {};

	DynamicCss.test = function () {
		return window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)');
	};

	DynamicCss.run = debounce(function () {
		var replace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

		if (replace) {
			var colors = RocketChat.settings.collection.find({
				_id: /theme-color-rc/i
			}, {
				fields: {
					value: 1,
					editor: 1
				}
			}).fetch().filter(function (color) {
				return color && color.value;
			});

			if (!colors) {
				return;
			}

			var css = colors.map(function (_ref) {
				var _id = _ref._id,
						value = _ref.value,
						editor = _ref.editor;

				if (editor === 'expression') {
					return '--' + _id.replace('theme-color-', '') + ': var(--' + value + ');';
				}

				return '--' + _id.replace('theme-color-', '') + ': ' + value + ';';
			}).join('\n');
			document.querySelector('#css-variables').innerHTML = ':root {' + css + '}';
		}

		cssVarPoly.init();
	}, 1000);
})();
