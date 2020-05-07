import _ from 'underscore';

(() => {
	if (window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)')) {
		return;
	}

	const cssVarPoly = {};

	cssVarPoly.init = () => {
		console.time('cssVarPoly');
		cssVarPoly.ratifiedVars = {};
		cssVarPoly.varsByBlock = [];
		cssVarPoly.oldCSS = [];
		cssVarPoly.findCSS();
		cssVarPoly.updateCSS();
		console.timeEnd('cssVarPoly');
	};

	cssVarPoly.findCSS = () => {
		const styleBlocks = Array.from(document.querySelectorAll('#css-variables, link[type="text/css"].__meteor-css__'));
		styleBlocks.forEach((block, counter) => {
			if (block.nodeName === 'STYLE') {
				const theCSS = block.innerHTML;
				cssVarPoly.findSetters(theCSS, counter);
				cssVarPoly.oldCSS[counter] = theCSS;
				return;
			}

			if (block.nodeName === 'LINK') {
				const url = block.getAttribute('href');
				cssVarPoly.oldCSS[counter] = '';
				cssVarPoly.getLink(url, counter, (counter, request) => {
					cssVarPoly.findSetters(request.responseText, counter);
					cssVarPoly.oldCSS[counter] = request.responseText;
					cssVarPoly.updateCSS();
				});
			}
		});
	};

	cssVarPoly.findSetters = (theCSS, counter) => {
		cssVarPoly.varsByBlock[counter] = theCSS.match(/(--[^:; ]+:..*?;)/g);
	};

	cssVarPoly.updateCSS = _.debounce(() => {
		cssVarPoly.ratifySetters(cssVarPoly.varsByBlock);
		cssVarPoly.oldCSS.filter((e) => e).forEach((css, id) => {
			const newCSS = cssVarPoly.replaceGetters(css, cssVarPoly.ratifiedVars);
			const el = document.querySelector(`#inserted${ id }`);

			if (el) {
				el.innerHTML = newCSS;
			} else {
				const style = document.createElement('style');
				style.type = 'text/css';
				style.innerHTML = newCSS;
				style.classList.add('inserted');
				style.id = `inserted${ id }`;
				document.getElementsByTagName('head')[0].appendChild(style);
			}
		});
	}, 100);

	cssVarPoly.replaceGetters = (oldCSS, varList) => oldCSS.replace(/var\((--.*?)\)/gm, (all, variable) => varList[variable]);

	cssVarPoly.ratifySetters = (varList) => {
		varList.filter((curVars) => curVars).forEach((curVars) => {
			curVars.forEach((theVar) => {
				const matches = theVar.split(/:\s*/);
				cssVarPoly.ratifiedVars[matches[0]] = matches[1].replace(/;/, '');
			});
		});
		Object.keys(cssVarPoly.ratifiedVars).filter((key) => cssVarPoly.ratifiedVars[key].indexOf('var') > -1).forEach((key) => {
			cssVarPoly.ratifiedVars[key] = cssVarPoly.ratifiedVars[key].replace(/var\((--.*?)\)/gm, (all, variable) => cssVarPoly.ratifiedVars[variable]);
		});
	};

	cssVarPoly.getLink = (url, counter, success) => {
		const request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.overrideMimeType('text/css;');

		request.onload = () => {
			if (request.status >= 200 && request.status < 400) {
				if (typeof success === 'function') {
					success(counter, request);
				}
			} else {
				console.warn('an error was returned from:', url);
			}
		};

		request.onerror = () => {
			console.warn('we could not get anything from:', url);
		};

		request.send();
	};

	const waitForCssVariables = () => {
		if (document.readyState !== 'complete') {
			requestAnimationFrame(waitForCssVariables);
			return;
		}

		const cssVariablesStyleObserver = new MutationObserver(() => {
			cssVarPoly.init();
		});

		cssVariablesStyleObserver.observe(document.querySelector('#css-variables'), { childList: true });

		cssVarPoly.init();
	};

	waitForCssVariables();
})();
