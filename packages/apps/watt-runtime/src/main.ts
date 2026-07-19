import './lib/loader-hook';

import { setSandboxGlobals, setSandboxRequire } from '@rocket.chat/apps/base-runtime/dist/handlers/app/construct';
import { startMainLoop } from '@rocket.chat/apps/base-runtime/dist/mainLoop';

import registerErrorListeners from './error-handlers';
import { installWattChannel } from './lib/wattChannel';
import { sandboxRequire } from './lib/require';

// The sandbox `require` handed to the app is Node's own global `require`; it
// needs no extra globals beyond the common ones the base eval shell binds.
setSandboxRequire(sandboxRequire);
setSandboxGlobals({});

registerErrorListeners();

// Bind the shared Apps-Engine message loop to Watt's inter-thread channel
// instead of the `child_process` IPC channel used by the subprocess runtime.
const incoming = installWattChannel();

startMainLoop(incoming);
