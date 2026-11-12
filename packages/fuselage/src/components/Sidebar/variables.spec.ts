import { readFileSync } from 'fs';
import { join } from 'path';

it('gives every theme hook in the Sidebar variables its own name', () => {
	const source = readFileSync(join(__dirname, 'variables.scss'), 'utf8');
	const hooks = [...source.matchAll(/theme\('([^']+)'/g)].map(([, name]) => name);

	expect(hooks.filter((name, index) => hooks.indexOf(name) !== index)).toEqual([]);
});
