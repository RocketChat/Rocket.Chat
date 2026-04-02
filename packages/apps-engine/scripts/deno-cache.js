const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const SHELL_ERR_CMD_NOT_FOUND = 127;

/**
 * Matches 'deno 2.3.1' or 'Deno 2.7.11-alpha3.24' or even 'some deno and-anything in between 1.43.5' (as long as everything is in the same line)
 * and extracts the correct version string from those ('2.3.1', '2.7.11' and '1.43.5' respectively).
 *
 * Doesn't match 'denoing 2.3.1' or 'deno2.3.1' or 'mydeno 2.7.11alpha3.24' or 'deno\n1.43.5'
 */
const extractDenoVersion = (input) => /\bdeno\b.*\b(?<version>\d+\.\d+\.\d+)(?<prerelease>-[\w.-]+)?\b/i.exec(input)?.groups?.version;

try {
	const toolVersionsPath = path.resolve(__dirname, '..', '..', '..', '.tool-versions');
	const denoToolVersion = extractDenoVersion(fs.readFileSync(toolVersionsPath).toString());

	if (!denoToolVersion) {
		throw new Error(`Invalid Deno version in ${toolVersionsPath}, aborting...`);
	}

	const installedVersion = extractDenoVersion(childProcess.execSync('deno --version').toString());

	if (!installedVersion) {
		throw new Error(
			`Couldn't determine version of installed Deno. Try validating the version with 'deno --version' and make sure it is a valid Deno installation`,
		);
	}

	if (installedVersion !== denoToolVersion) {
		throw new Error(`Incorrect Deno version. Required '${denoToolVersion}', found '${installedVersion}'`);
	}
} catch (e) {
	if (e.status === SHELL_ERR_CMD_NOT_FOUND) {
		console.error(
			new Error(
				[
					'Could not execute "deno" in the system. It is now a requirement for the Apps-Engine framework, and Rocket.Chat apps will not work without it.',
					'Make sure to install Deno and run the installation process for the Apps-Engine again. More info on https://docs.deno.com/runtime/manual/getting_started/installation',
				].join('\n'),
				{ cause: e },
			),
		);
	} else {
		console.error(e);
	}

	process.exit(1);
}

const rootPath = path.join(__dirname, '..');
const denoRuntimePath = path.join(rootPath, 'deno-runtime');
const DENO_DIR = process.env.DENO_DIR ?? path.join(rootPath, '.deno-cache');

childProcess.execSync('deno install --frozen --entrypoint main.ts', {
	cwd: denoRuntimePath,
	env: {
		...process.env,
		DENO_DIR,
	},
	stdio: 'inherit',
});
