import _ from 'underscore';

type Variables = {
	[name: string]: (variables: Variables) => string;
};

const findDeclarations = (code: string): [string, Variables[keyof Variables]][] =>
	(code.match(/(--[^:; ]+:..*?;)/g) ?? []).map((declaration) => {
		const matches = /(.*?):\s*(.*?)\s*;/.exec(declaration);

		if (matches === null) {
			throw new Error();
		}

		const [, name, value] = matches;
		return [
			name,
			value.indexOf('var(') >= 0
				? (variables: Variables): string => value.replace(/var\((--.*?)\)/gm, (_, name) => variables[name]?.call(null, variables))
				: (): string => value,
		];
	});

const replaceReferences = (code: string, variables: Variables): string =>
	code.replace(/var\((--.*?)\)/gm, (_, name) => variables[name]?.call(null, variables));

let cssVariablesElement: HTMLElement;
const originalCodes = new Map();

const update = _.debounce(() => {
	const declarations = ([] as [string, Variables[keyof Variables]][]).concat(
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
		sheet.insertRule(`@media all {${patchedCode}}`, 0);
	});
}, 100);

const findAndPatchFromLinkElements = (): void => {
	Array.from(document.querySelectorAll('link[type="text/css"].__meteor-css__')).forEach(async (linkElement) => {
		const url = linkElement.getAttribute('href');

		if (url === null) {
			return;
		}

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

const waitAndInitialize = (): void => {
	if (document.readyState !== 'complete') {
		requestAnimationFrame(waitAndInitialize);
		return;
	}

	const element = document.getElementById('css-variables');

	if (element === null) {
		requestAnimationFrame(waitAndInitialize);
		return;
	}

	cssVariablesElement = element;

	const cssVariablesElementObserver = new MutationObserver(() => {
		update();
	});

	cssVariablesElementObserver.observe(cssVariablesElement, { childList: true });

	findAndPatchFromLinkElements();
};

((): void => {
	if (window.CSS?.supports?.('(--foo: red)')) {
		return;
	}

	waitAndInitialize();
})();
