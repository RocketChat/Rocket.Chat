'use strict';

/**
 * Reports what one test file catches that no other test catches.
 *
 * A mutation score says how much of a target's behaviour some test checks. It does not say which test, so a
 * test can score well on code another test already covers. The marginal question is the one worth asking of
 * a test you suspect is shallow: if it went away, what would stop being caught?
 *
 * Run the same target twice and diff the two reports:
 *
 *   TARGET=UIActionButtonManager SCOPE=all         yarn testmutation
 *   TARGET=UIActionButtonManager SCOPE=all-but-own yarn testmutation
 *   node scripts/mutation-unique-kills.js UIActionButtonManager
 *
 * A mutant killed under `all` and surviving under `all-but-own` is a unique kill. Unique kills are what the
 * test is worth. A test with none is either redundant or the last line on code nothing reaches.
 */

const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
	throw new Error('usage: node scripts/mutation-unique-kills.js <TARGET>');
}

const reportDir = path.join(__dirname, '..', 'reports', 'mutation');

const read = (scope) => {
	const file = path.join(reportDir, `${target}.${scope}.json`);
	if (!fs.existsSync(file)) {
		throw new Error(`missing ${file}. Run TARGET=${target} SCOPE=${scope} yarn testmutation first.`);
	}
	const report = JSON.parse(fs.readFileSync(file, 'utf8'));
	const byId = new Map();
	for (const [name, data] of Object.entries(report.files)) {
		for (const mutant of data.mutants) {
			byId.set(`${name}:${mutant.location.start.line}:${mutant.location.start.column}:${mutant.mutatorName}:${mutant.replacement}`, {
				...mutant,
				file: name,
			});
		}
	}
	return byId;
};

const withOwn = read('all');
const withoutOwn = read('all-but-own');

const unique = [];
const redundant = [];
const missed = [];

for (const [id, mutant] of withOwn) {
	const other = withoutOwn.get(id);
	if (mutant.status !== 'Killed') {
		if (mutant.status === 'Survived') missed.push(mutant);
		continue;
	}
	if (!other || other.status === 'Killed') {
		redundant.push(mutant);
	} else {
		unique.push(mutant);
	}
}

const line = (mutant) => `  ${mutant.file}:${mutant.location.start.line}  ${mutant.mutatorName}`;

console.log(`${target}`);
console.log(`  killed only by this test : ${unique.length}`);
console.log(`  killed by others too     : ${redundant.length}`);
console.log(`  survives everything      : ${missed.length}`);
console.log('');

if (unique.length) {
	console.log('Unique kills — delete the test and these stop being caught:');
	const byLine = new Map();
	for (const mutant of unique) {
		const key = `${mutant.file}:${mutant.location.start.line}`;
		if (!byLine.has(key)) byLine.set(key, new Set());
		byLine.get(key).add(mutant.mutatorName);
	}
	for (const [where, mutators] of [...byLine].sort()) {
		console.log(`  ${where}  ${[...mutators].sort().join(', ')}`);
	}
}

if (redundant.length) {
	console.log('');
	console.log('Also killed without this test:');
	for (const mutant of redundant.slice(0, 20)) console.log(line(mutant));
}
