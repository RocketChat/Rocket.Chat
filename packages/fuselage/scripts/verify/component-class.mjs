import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const components = join(import.meta.dirname, '../../src/components');

/**
 * The `rcx-*` root class of a component, read from its own sources: the class literal that spells the component's name
 * (`NavBar` is `rcx-navbar`, `CheckBox` is `rcx-check-box`). Without a source to read it falls back to the kebab-cased name.
 */
export const rootClass = (component, directory = components) => {
	const flat = `rcx-${component.toLowerCase()}`;
	const sources = readdirSync(join(directory, component), { recursive: true }).filter((f) => /\.(?:tsx?|s?css)$/.test(f) && !/\.(?:spec|stories)\./.test(f));
	for (const file of sources) {
		const literal = [...readFileSync(join(directory, component, file), 'utf8').matchAll(/rcx-[a-z0-9]+(?:-[a-z0-9]+)*/g)].find(
			([name]) => name.replaceAll('-', '') === flat.replaceAll('-', ''),
		);
		if (literal) return literal[0];
	}
	return `rcx-${component.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
};
