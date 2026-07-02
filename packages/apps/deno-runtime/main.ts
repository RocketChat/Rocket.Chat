import { Buffer } from 'node:buffer';
import { Socket } from 'node:net';
import process from 'node:process';

// Deno consumes the base as TypeScript source through the import map: ESM
// imports honor the map (`@rocket.chat/apps/` → `../`), so bare specifiers and
// `@rocket.chat/apps/*` resolve to allowed paths. Importing the compiled `dist`
// instead would run the base as CommonJS, whose `require()` bypasses the import
// map and falls back to node_modules — outside the subprocess read allowlist.
import { stdoutTransport } from './lib/transports/stdoutTransport';
import { setTransport } from './lib/messenger';

import { setSandboxGlobals, setSandboxRequire } from './handlers/app/construct';
import registerErrorListeners from './error-handlers';
import { require } from './lib/require';
import { startMainLoop } from './mainLoop';

if (!process.argv.includes('--subprocess')) {
	process.stderr.write(`
            This is a Deno wrapper for Rocket.Chat Apps. It is not meant to be executed stand-alone;
            It is instead meant to be executed as a subprocess by the Apps-Engine framework.
       `);
	process.exit(1001);
}

function prepareEnvironment() {
	// Deno does not behave equally to Node when it comes to piping content to a socket
	// So we intervene here
	const originalFinal = Socket.prototype._final;
	// deno-lint-ignore no-explicit-any
	Socket.prototype._final = function _final(cb: any) {
		// Deno closes the readable stream in the Socket earlier than Node
		// The exact reason for that is yet unknown, so we'll need to simply delay the execution
		// which allows data to be read in a response
		setTimeout(() => originalFinal.call(this, cb), 1);
	};
}

// This runtime communicates with the Apps-Engine host through stdout
setTransport(stdoutTransport);

// Deno's sandbox `require` is a createRequire shim that resolves compiled
// apps-engine paths; the eval shell additionally needs a `Buffer` and a
// shadowed `Deno` (→ undefined) bound by name.
setSandboxRequire(require);
setSandboxGlobals({ Buffer, Deno: undefined });

registerErrorListeners();

// Process-global side effect; doing it once at startup is cleaner than inside construct
prepareEnvironment();

startMainLoop();
