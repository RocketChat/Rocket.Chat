import './lib/loader-hook';

import { setSandboxGlobals, setSandboxRequire } from '@rocket.chat/apps/base-runtime/dist/handlers/app/construct';
import { setTransport } from '@rocket.chat/apps/base-runtime/dist/lib/messenger';
import { startMainLoop } from '@rocket.chat/apps/base-runtime/dist/mainLoop';

import registerErrorListeners from './error-handlers';
import { sandboxRequire } from './lib/require';
import { stdoutTransport } from './lib/transports/stdoutTransport';

if (!process.argv.includes('--subprocess')) {
	console.error(
		new TextEncoder().encode(`
            This is the Node wrapper for the Rocket.Chat Apps runtime. It is not meant to be executed stand-alone;
            It is instead meant to be executed as a subprocess by the Apps-Engine framework.
       `),
	);

	process.exit(1);
}

// This runtime communicates with the Apps-Engine host through stdout
setTransport(stdoutTransport);

// The sandbox `require` handed to the app is Node's own global `require`; it
// needs no extra globals beyond the common ones the base eval shell binds.
setSandboxRequire(sandboxRequire);
setSandboxGlobals({});

registerErrorListeners();

void startMainLoop();
