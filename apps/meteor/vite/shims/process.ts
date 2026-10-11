// Some dependencies (path.js via mime-type, util) read `process` at module load, as Node code does.
// Meteor shipped meteor-node-stubs for this; the Vite build installs the same browser shim first.
import process from 'process/browser.js';

globalThis.process ??= process;
