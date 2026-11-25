import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { apiUrl } from '../data/api-data';

// Keeps the server files each API test file ran attributable to it, so CI can select API tests by the server code they run
if (process.env.E2E_COVERAGE) {
	const nodeTest = createRequire(__filename)('node:test') as typeof import('node:test');
	const { describe } = nodeTest;
	const output = path.join(process.cwd(), '.e2e-impact');

	const serverFilesSinceLastCall = async (): Promise<string | undefined> => {
		const response = await fetch(`${apiUrl}/__coverage__/functions`).catch(() => undefined);
		return response?.ok ? response.text() : undefined;
	};

	const callerFile = (): string | undefined =>
		(new Error().stack ?? '')
			.split('\n')
			.map((line) => line.match(/(?:file:\/\/)?(\/[^():]+\.[cm]?ts):\d+:\d+/)?.[1])
			.find((file) => file && file !== __filename);

	let depth = 0;
	let baseline = false;

	const wrapped = function (this: unknown, name: string, ...rest: unknown[]) {
		const fn = rest.pop() as (...args: unknown[]) => void;
		const file = depth === 0 ? callerFile() : undefined;
		if (!file) {
			return Reflect.apply(describe, this, [name, ...rest, fn]);
		}
		const spec = encodeURIComponent(`apps/meteor/${path.relative(process.cwd(), file)}`);

		return Reflect.apply(describe, this, [
			name,
			...rest,
			function (this: unknown, ...args: unknown[]) {
				// Server code that runs before any test file, such as startup, belongs to no test file
				nodeTest.before(async () => {
					if (!baseline) {
						baseline = true;
						await serverFilesSinceLastCall();
					}
				});
				depth++;
				try {
					fn.apply(this, args);
				} finally {
					depth--;
				}
				nodeTest.after(async () => {
					const files = await serverFilesSinceLastCall();
					if (files) {
						mkdirSync(output, { recursive: true });
						writeFileSync(path.join(output, `server_coverage_${spec}_${randomUUID()}.json`), files);
					}
				});
			},
		]);
	};

	nodeTest.describe = Object.assign(wrapped, describe) as typeof describe;
}
