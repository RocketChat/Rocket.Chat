import _ from 'underscore';

const findDeclarations = (code) => (code.match(/(--[^:; ]+:..*?;)/g) ?? [])
	.map((declaration) => {
		const [, name, value] = /(.*?):\s*(.*?)\s*;/.exec(declaration);
		return [
			name,
			value.indexOf('var(') >= 0
				? (variables) => value.replace(/var\((--.*?)\)/gm, (_, name) => variables[name]?.call(null, variables))
				: () => value,
		];
	});

const replaceReferences = (code, variables) =>
	code.replace(/var\((--.*?)\)/gm, (_, name) => variables[name]?.call(null, variables));

let cssVariablesElement;
const originalCodes = new Map();

const update = _.debounce(() => {
	const declarations = [].concat(
		...Array.from(originalCodes.values(), findDeclarations),
		findDeclarations(cssVariablesElement.innerHTML),
	);

	const variables = Object.fromEntries(declarations);

	originalCodes.forEach((originalCode, element) => {
		const patchedCode = replaceReferences(originalCode, variables);

		let patchedElement = element.nextElementSibling;
		if (!patchedElement || !patchedElement.classList.contains('patched-css-variables')) {
			patchedElement = document.createElement('style');
			patchedElement.type = 'text/css';
			patchedElement.classList.add('patched-css-variables');
			element.insertAdjacentElement('afterend', patchedElement);
		}

		const { sheet } = patchedElement;
		while (sheet.cssRules.length > 0) {
			sheet.deleteRule(0);
		}
		sheet.insertRule(`@media all {${ patchedCode }}`, 0);
	});
}, 100);

const findAndPatchFromLinkElements = () => {
	Array.from(document.querySelectorAll('link[type="text/css"].__meteor-css__')).forEach(async (linkElement) => {
		const url = linkElement.getAttribute('href');
		try {
			const response = await fetch(url);
			const code = await response.text();
			originalCodes.set(linkElement, code);
		} catch (error) {
			console.warn(error);
		} finally {
			update();
		}
	});
};

const waitAndInitialize = () => {
	if (document.readyState !== 'complete') {
		requestAnimationFrame(waitAndInitialize);
		return;
	}

	cssVariablesElement = document.getElementById('css-variables');

	const cssVariablesElementObserver = new MutationObserver(() => {
		update();
	});

	cssVariablesElementObserver.observe(cssVariablesElement, { childList: true });

	findAndPatchFromLinkElements();
};

(() => {
	if (window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)')) {
		return;
	}

	waitAndInitialize();
})();
