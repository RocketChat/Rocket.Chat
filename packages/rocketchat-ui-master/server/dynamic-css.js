/* global DynamicCss */

'use strict';
export default () => {

	const debounce = (func, wait, immediate) => {
		let timeout;
		return function(...args) {
			const later = () => {
				timeout = null;
				!immediate && func.apply(this, args);
			};
			const callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			callNow && func.apply(this, args);
		};
	};
	const cssVarPoly = {
		test() { return window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)'); },
		init() {
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
		findCSS() {
			const styleBlocks = Array.prototype.concat.apply([], document.querySelectorAll('#css-variables, link[type="text/css"].__meteor-css__'));

			// we need to track the order of the style/link elements when we save off the CSS, set a counter
			let counter = 1;

			// loop through all CSS blocks looking for CSS variables being set
			styleBlocks.map(block => {
				// console.log(block.nodeName);
				if (block.nodeName === 'STYLE') {
					const theCSS = block.innerHTML;
					cssVarPoly.findSetters(theCSS, counter);
					cssVarPoly.oldCSS[counter++] = theCSS;
				} else if (block.nodeName === 'LINK') {
					const url = block.getAttribute('href');
					cssVarPoly.oldCSS[counter] = '';
					cssVarPoly.getLink(url, counter, function(counter, request) {
						cssVarPoly.findSetters(request.responseText, counter);
						cssVarPoly.oldCSS[counter++] = request.responseText;
						cssVarPoly.updateCSS();
					});
				}
			});
		},

		// find all the "--variable: value" matches in a provided block of CSS and add them to the master list
		findSetters(theCSS, counter) {
			// console.log(theCSS);
			cssVarPoly.varsByBlock[counter] = theCSS.match(/(--[^:; ]+:..*?;)/g);
		},

		// run through all the CSS blocks to update the variables and then inject on the page
		updateCSS: debounce(() => {
			// first lets loop through all the variables to make sure later vars trump earlier vars
			cssVarPoly.ratifySetters(cssVarPoly.varsByBlock);

			// loop through the css blocks (styles and links)
			cssVarPoly.oldCSS.filter(e => e).forEach((css, id) => {
				const newCSS = cssVarPoly.replaceGetters(css, cssVarPoly.ratifiedVars);
				const el = document.querySelector(`#inserted${ id }`);
				if (el) {
					// console.log("updating")
					el.innerHTML = newCSS;
				} else {
					// console.log("adding");
					const style = document.createElement('style');
					style.type = 'text/css';
					style.innerHTML = newCSS;
					style.classList.add('inserted');
					style.id = `inserted${ id }`;
					document.getElementsByTagName('head')[0].appendChild(style);
				}
			});
		}, 100),

		// parse a provided block of CSS looking for a provided list of variables and replace the --var-name with the correct value
		replaceGetters(oldCSS, varList) {
			return oldCSS.replace(/var\((--.*?)\)/gm, (all, variable) => varList[variable]);
		},

		// determine the css variable name value pair and track the latest
		ratifySetters(varList) {
			// loop through each block in order, to maintain order specificity
			varList.filter(curVars => curVars).forEach(curVars => {
				// const curVars = varList[curBlock] || [];
				curVars.forEach(function(theVar) {
					// console.log(theVar);
					// split on the name value pair separator
					const matches = theVar.split(/:\s*/);
					// console.log(matches);
					// put it in an object based on the varName. Each time we do this it will override a previous use and so will always have the last set be the winner
					// 0 = the name, 1 = the value, strip off the ; if it is there
					cssVarPoly.ratifiedVars[matches[0]] = matches[1].replace(/;/, '');
				});
			});
			Object.keys(cssVarPoly.ratifiedVars).filter(key => {
				return cssVarPoly.ratifiedVars[key].indexOf('var') > -1;
			}).forEach(key => {
				cssVarPoly.ratifiedVars[key] = cssVarPoly.ratifiedVars[key].replace(/var\((--.*?)\)/gm, function(all, variable) {
					return cssVarPoly.ratifiedVars[variable];
				});
			});
		},
		// get the CSS file (same domain for now)
		getLink(url, counter, success) {
			const request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.overrideMimeType('text/css;');
			request.onload = function() {
				if (request.status >= 200 && request.status < 400) {
					// Success!
					// console.log(request.responseText);
					if (typeof success === 'function') {
						success(counter, request);
					}
				} else {
					// We reached our target server, but it returned an error
					console.warn('an error was returned from:', url);
				}
			};

			request.onerror = function() {
				// There was a connection error of some sort
				console.warn('we could not get anything from:', url);
			};

			request.send();
		}

	};
	const stateCheck = setInterval(() => {
		if (document.readyState === 'complete' && typeof Meteor !== 'undefined') {
			clearInterval(stateCheck);
			// document ready
			cssVarPoly.init();
		}
	}, 100);

	DynamicCss = typeof DynamicCss !=='undefined'? DynamicCss : {};
	DynamicCss.test = () => window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)');
	DynamicCss.run = debounce((replace = false) => {
		if (replace) {
			// const variables = RocketChat.models.Settings.findOne({_id:'theme-custom-variables'}, {fields: { value: 1}});
			const colors = RocketChat.settings.collection.find({_id:/theme-color-rc/i}, {fields: { value: 1, editor: 1}}).fetch().filter(color => color && color.value);

			if (!colors) {
				return;
			}
			const css = colors.map(({_id, value, editor}) => {
				if (editor === 'expression') {
					return `--${ _id.replace('theme-color-', '') }: var(--${ value });`;
				}
				return `--${ _id.replace('theme-color-', '') }: ${ value };`;
			}).join('\n');
			document.querySelector('#css-variables').innerHTML = `:root {${ css }}`;
		}
		cssVarPoly.init();
	}, 1000);
};
