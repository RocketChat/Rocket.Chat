// Runs the E2EE search browser backend checks in real browsers.
// Usage: node run.mjs [chrome] [firefox] [safari]. With no argument, it runs all three.
// Starts one driver per browser, prints one summary line per browser, and exits 0 only when every check passes.
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const BROWSERS = ['chrome', 'firefox', 'safari'];

const requested = process.argv.slice(2);
const unknown = requested.filter((name) => !BROWSERS.includes(name));
if (unknown.length > 0) {
	console.error(`unknown browser: ${unknown.join(', ')}. Use any of: ${BROWSERS.join(' ')}`);
	process.exit(2);
}
const browsers = requested.length > 0 ? requested : BROWSERS;
mkdirSync(OUT, { recursive: true });

const runDriver = (browser) =>
	new Promise((resolve) => {
		const log = createWriteStream(join(OUT, `${browser}.log`));
		const child = spawn(process.execPath, [join(HERE, 'driver.mjs'), browser], { stdio: ['ignore', 'pipe', 'pipe'] });
		child.stdout.on('data', (chunk) => {
			process.stdout.write(chunk);
			log.write(chunk);
		});
		child.stderr.on('data', (chunk) => {
			process.stderr.write(chunk);
			log.write(chunk);
		});
		child.on('close', (code) => {
			log.end();
			resolve(code);
		});
	});

const summarize = (browser, code) => {
	let report;
	try {
		report = JSON.parse(readFileSync(join(OUT, `results-${browser}.json`), 'utf8'));
	} catch {
		return { ok: false, line: `${browser}: no results, driver exit ${code}. See ${join(OUT, `${browser}.log`)}` };
	}
	const failed = report.tests.filter((test) => test.status === 'FAIL').length;
	const passed = report.tests.length - failed;
	const transport = report.transport ? ` via ${report.transport}` : '';
	const fatal = report.fatal ? `; fatal: ${report.fatal}` : '';
	return {
		ok: code === 0 && !report.fatal && passed > 0 && failed === 0,
		line: `${browser}: ${passed} passed, ${failed} failed${transport}${fatal}`,
	};
};

let allOk = true;
for (const browser of browsers) {
	rmSync(join(OUT, `results-${browser}.json`), { force: true });
	const code = await runDriver(browser);
	const outcome = summarize(browser, code);
	allOk &&= outcome.ok;
	console.log(outcome.line);
}
process.exitCode = allOk ? 0 : 1;
