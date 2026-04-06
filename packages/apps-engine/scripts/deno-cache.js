const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const SHELL_ERR_CMD_NOT_FOUND = 127;
const { CI } = process.env;

/**
 * Matches 'deno 2.3.1' or 'Deno 2.7.11-alpha3.24' or even 'some deno and-anything in between 1.43.5' (as long as everything is in the same line)
 * and extracts the correct version string from those ('2.3.1', '2.7.11' and '1.43.5' respectively).
 *
 * Doesn't match 'denoing 2.3.1' or 'deno2.3.1' or 'mydeno 2.7.11alpha3.24' or 'deno\n1.43.5'
 *
 * The expression gets a bit complicated because the word boundary assertion (\b) identifies the dash (-) as a valid word boundary,
 * but that is not the case for use, as we don't want to match "make-deno" for instance. So, for correctness, we use a negative lookbehind
 * assertion ("(?<!)") BEFORE words to make sure our match is not preceded by a word character (\w), a dash (-) or a dot (.), e.g. it won't
 * match "mydeno", "my-deno", "my.deno", etc. The negative lookbehind also allows us to match "deno" in the start of the input, something that
 * simply using the expression itself wouldn't match. In most other cases, these would be replaced by simply "\b"
 *
 * The exact expression tries find the first line to match a sequence as follows:
 *  - A character "D" or "d" that is not preceded by a word character, dash or dot (negative lookbehind)
 *  - Followed by the literal sequence "eno"
 *  - Followed by any character that is not a word character, dash or dot
 *  - Followed by a sequence of zero or more occurrences of any character (non multi line)
 *  - Followed by a sequence of one or more numbers, then a dot, then one or more numbers, then a dot, then one or more numbers ("version" capture group)
 *    that is NOT preceded by a word character, a dash, or dot (negative lookbehind)
 *  - Followed by a word boundary (here we're less picky with the "\b" assertion, as we're out of the capture group)
 */
const extractDenoVersion = (input) => /(?<![\w-.])[Dd]eno[^\w-.].*(?<![\w-.])(?<version>\d+\.\d+\.\d+)\b/.exec(input)?.groups?.version;

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
		const message = `Incorrect Deno version. Required '${denoToolVersion}', found '${installedVersion}'.${CI ? '' : " The server will likely work, but it may cause your deno.lock to change - do not commit it. Make sure your Deno version matches the required one so you don't see this message again."}`;

		if (CI) {
			throw new Error(message);
		}

		// We don't need to fail if a dev environment doesn't have a matching Deno version, just the warning is enough
		console.warn(message);
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

// In CI envs, break if lockfile changes; in dev envs, it's alright
const commandLine = CI ? 'deno install --frozen --entrypoint main.ts' : 'deno install --entrypoint main.ts';

childProcess.execSync(commandLine, {
	cwd: denoRuntimePath,
	env: {
		...process.env,
		DENO_DIR,
	},
	stdio: 'inherit',
});
