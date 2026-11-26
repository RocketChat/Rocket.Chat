// Writes the style values of a component's Tamagui frames into the module that declares them.
//
//   yarn generate:frame-values          rewrite the generated section of every target
//   yarn generate:frame-values --check  fail if one is stale (what `yarn lint` runs)
//
// Tamagui's compiler reads a `styled()` definition from the source of its module, so the values cannot be computed
// there or imported. Each module directly in `scripts/frame-values/` default-exports the `Target[]` of one component;
// the fixture the generator is tested with is generated along with them.
import { join } from 'node:path';

import { generateFrameValues, loadModules } from './frame-values/lib/generate.mts';

const modules = await Promise.all(
	['frame-values', 'frame-values/lib/fixture'].map((directory) => loadModules(join(import.meta.dirname, directory))),
);
const problems = [
	...modules.flatMap((loaded) => loaded.problems),
	...(await generateFrameValues(
		modules.flatMap((loaded) => loaded.targets),
		process.argv.includes('--check'),
	)),
];

problems.forEach((problem) => console.error(problem));
process.exit(problems.length ? 1 : 0);
