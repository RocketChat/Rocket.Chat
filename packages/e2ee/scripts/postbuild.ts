import { writeFile } from 'node:fs/promises';

// Create the CJS module entry point
// Require the E2EE class from the ESM module

await writeFile('./dist/index.cjs', "module.exports = require('./index.js');\n");
