import hash from '@emotion/hash';

const elementId = 'rcx-styles';
const documentStyleElementMap = new WeakMap<Document, HTMLStyleElement>();

const getStyleTag = (document: Document): HTMLStyleElement => {
	let element = documentStyleElementMap.get(document);

	if (!element) {
		const el = document.getElementById(elementId) as HTMLStyleElement;
		if (el) {
			documentStyleElementMap.set(document, el);
			return el;
		}
	}

	if (!element) {
		element = document.createElement('style');

		documentStyleElementMap.set(document, element);

		element.id = elementId;
		element.appendChild(document.createTextNode(''));

		if (document.head) {
			document.head.appendChild(element);
		}
	}

	return element;
};

const documentStyleSheetMap = new WeakMap<Document, CSSStyleSheet>();
const getStyleSheet = (document: Document): CSSStyleSheet => {
	let styleSheet = documentStyleSheetMap.get(document);

	if (!styleSheet) {
		const styleTag = getStyleTag(document);
		const _styleSheet = styleTag.sheet || Array.from(document.styleSheets).find(({ ownerNode }) => ownerNode === styleTag);

		if (!_styleSheet) {
			throw Error('could not get style sheet');
		}

		styleSheet = _styleSheet;
	}

	documentStyleSheetMap.set(document, styleSheet);

	return styleSheet;
};

type StrictRuleAttacher = (rules: string, options: { document: Document }) => () => void;

export type RuleAttacher = (rules: string, options?: { document?: Document }) => () => void;

const discardRules: RuleAttacher = () => () => undefined;

const attachRulesIntoElement: StrictRuleAttacher = (rules, { document }) => {
	const element = getStyleTag(document);

	const textNode = document.createTextNode(rules);
	element.appendChild(textNode);

	return () => textNode.remove();
};

const attachRulesIntoStyleSheet: StrictRuleAttacher = (rules, { document }) => {
	const styleSheet = getStyleSheet(document);
	const index = styleSheet.insertRule(`@media all{${rules}}`, styleSheet.cssRules.length);
	const insertedRule = styleSheet.cssRules[index];

	return () => {
		const index = Array.prototype.findIndex.call(styleSheet.cssRules, (cssRule: CSSRule): boolean => cssRule === insertedRule);
		styleSheet.deleteRule(index);
	};
};

type RefCounter = Record<string, { ref(): void; unref(): void }>;

const wrapReferenceCounting = (attacher: StrictRuleAttacher): RuleAttacher => {
	const refDocumentMap = new WeakMap<Document, RefCounter>();

	const queueMicrotask = (fn: () => void): void => {
		if (typeof window === 'undefined' || typeof window.queueMicrotask !== 'function') {
			void Promise.resolve().then(fn);
			return;
		}

		window.queueMicrotask(fn);
	};

	const enhancedAttacher: RuleAttacher = (content, options = {}) => {
		const id = hash(content);
		const document = options.document ? options.document : window.document;

		const refs = refDocumentMap.get(document) || {};

		if (!refDocumentMap.has(document)) {
			refDocumentMap.set(document, refs);
		}

		if (!refs[id]) {
			const detach = attacher(content, {
				...options,
				document: options.document ? options.document : window.document,
			});
			let count = 0;

			const ref = (): void => {
				++count;
			};

			const unref = (): void => {
				queueMicrotask(() => {
					--count;
					if (count === 0) {
						detach();
						delete refs[id];
					}
				});
			};

			refs[id] = {
				ref,
				unref,
			};
		}

		refs[id].ref();
		return refs[id].unref;
	};

	return enhancedAttacher;
};

/**
 * Imediately attaches CSS rules into the style sheet.
 *
 * @returns a callback to detach the rules
 */
export const attachRules: RuleAttacher =
	(typeof window === 'undefined' && discardRules) ||
	// eslint-disable-next-line dot-notation
	(process.env['NODE_ENV'] === 'production' && !!CSSStyleSheet.prototype.insertRule && wrapReferenceCounting(attachRulesIntoStyleSheet)) ||
	wrapReferenceCounting(attachRulesIntoElement);
