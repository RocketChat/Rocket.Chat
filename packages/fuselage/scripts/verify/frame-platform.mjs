// Usage: node scripts/verify/frame-platform.mjs [dir (src)]
// A frame is a module that declares `styled(...)`. It must stay renderable on React Native, so it imports nothing from
// `react-dom`, names no DOM-only type (`HTMLAttributes`, `HTMLDivElement`, `ComponentProps<'div'>`, `MouseEvent`, ...) and reads no browser
// global (`document`, `window`, ...); a web-only wrapper belongs in another module. The check reads one file at a time: a frame that imports a local helper which imports `react-dom`
// is not caught. A `*.contract.ts` module is what both renderers of a component take, so it is held to the same rule.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FRAME = /\bstyled(?:<[\s\S]*?>)?\(/;
const DOM_IMPORT = /\b(?:from|import|require)\s*\(?\s*['"]react-dom(?:\/[^'"]*)?['"]/;
const DOM_GLOBAL =
	/(?<![\w$.])(?:globalThis\.)?(document|window|navigator|localStorage|sessionStorage)\s*[.[]|\btypeof\s+(document|window|navigator|localStorage|sessionStorage)\b/;
const DOM_TYPE =
	/\b(?:\w*HTMLAttributes|HTMLProps|HTML\w*Element|SVGAttributes|SVG\w*Element|DOMAttributes|JSX\.IntrinsicElements|Document|DocumentFragment|Window|Navigator|Storage|CSSStyleDeclaration|(?:Mouse|Keyboard|Focus|Pointer|Touch|Wheel|Drag|Clipboard|Composition|Input|Animation|Transition|UI)Event)\b|\bComponentProps(?:WithRef|WithoutRef)?<\s*['"]/;

const withoutComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** The reasons a module breaks the rule; none for a module that is neither a frame nor a contract. */
export const checkFrame = (source, isContract = false) => {
	const code = withoutComments(source);
	if (!isContract && !FRAME.test(code)) return [];

	return [
		DOM_IMPORT.test(code) && 'imports react-dom',
		DOM_TYPE.test(code) && `uses the DOM-only type ${DOM_TYPE.exec(code)[0]}`,
		DOM_GLOBAL.test(code) && `reads the browser global ${DOM_GLOBAL.exec(code).slice(1).find(Boolean)}`,
	].filter(Boolean);
};

const sourceFiles = (directory) =>
	readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sourceFiles(path);
		return /\.(?:ts|tsx)$/.test(entry.name) && !/\.(?:spec|stories)\.tsx?$/.test(entry.name) ? [path] : [];
	});

export const checkFrames = (directory) =>
	sourceFiles(directory).flatMap((file) =>
		checkFrame(readFileSync(file, 'utf8'), file.endsWith('.contract.ts')).map((reason) => `${file}: ${reason}`),
	);

if (import.meta.filename === process.argv[1]) {
	const problems = checkFrames(process.argv[2] ?? join(import.meta.dirname, '../../src'));
	if (problems.length) {
		console.error(problems.join('\n'));
		process.exit(1);
	}
	console.log('Every Tamagui frame and contract is platform-neutral.');
}
