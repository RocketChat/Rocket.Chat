// Fails the build when the published bundles read an environment variable other than NODE_ENV at run time.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');
const offenders = [];

for (const file of readdirSync(dist)) {
	if (!file.endsWith('.js')) {
		continue;
	}

	const code = readFileSync(join(dist, file), 'utf8');
	const names = new Set(code.match(/\bprocess\.env\.(?!NODE_ENV\b)[A-Za-z_][A-Za-z0-9_]*/g) ?? []);
	if (names.size) {
		offenders.push(`${file}: ${[...names].join(', ')}`);
	}
}

if (offenders.length) {
	console.error(`dist reads environment variables at run time:\n${offenders.join('\n')}`);
	process.exit(1);
}
