import hljs, { isHighlightReady, loadHighlightLanguages } from './highlight';

it('registers a language only once it is requested', async () => {
	expect(hljs.getLanguage('rust')).toBeUndefined();
	expect(isHighlightReady('rust')).toBe(false);

	await loadHighlightLanguages('rust');

	expect(hljs.getLanguage('rust')).toBeDefined();
	expect(isHighlightReady('rust')).toBe(true);
});

it('resolves aliases to the language that declares them', async () => {
	await loadHighlightLanguages('TS');

	expect(hljs.getLanguage('typescript')).toBeDefined();
	expect(hljs.getLanguage('ts')).toBeDefined();
	expect(isHighlightReady('ts')).toBe(true);
});

it('registers the sub-languages a language embeds', async () => {
	await loadHighlightLanguages('php-template');

	expect(hljs.getLanguage('php')).toBeDefined();
	expect(hljs.getLanguage('xml')).toBeDefined();
});

it('treats unknown languages as ready without registering anything', async () => {
	expect(isHighlightReady('not-a-language')).toBe(true);
	await expect(loadHighlightLanguages('not-a-language')).resolves.toBeUndefined();
	expect(hljs.getLanguage('not-a-language')).toBeUndefined();
});

it('auto-detects blocks without a language among the default candidates', async () => {
	await loadHighlightLanguages(undefined);

	expect(isHighlightReady(undefined)).toBe(true);
	expect(isHighlightReady('none')).toBe(true);
	expect(hljs.highlightAuto('fn main() { let x: i32 = 5; println!("{}", x); }').language).toBe('rust');
});
