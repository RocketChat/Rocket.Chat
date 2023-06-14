import fs from 'fs';
import path from 'path';

import unified from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import mdastToString from 'mdast-util-to-string';

export const BumpLevels = {
	dep: 0,
	patch: 1,
	minor: 2,
	major: 3,
} as const;

export function getChangelogEntry(changelog: string, version: string) {
	const ast = unified().use(remarkParse).parse(changelog);

	let highestLevel: number = BumpLevels.dep;

	const nodes = (ast as any).children as Array<any>;
	let headingStartInfo:
		| {
				index: number;
				depth: number;
		  }
		| undefined;
	let endIndex: number | undefined;

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		if (node.type === 'heading') {
			const stringified: string = mdastToString(node);
			const match = stringified.toLowerCase().match(/(major|minor|patch)/);
			if (match !== null) {
				const level = BumpLevels[match[0] as 'major' | 'minor' | 'patch'];
				highestLevel = Math.max(level, highestLevel);
			}
			if (headingStartInfo === undefined && stringified === version) {
				headingStartInfo = {
					index: i,
					depth: node.depth,
				};
				continue;
			}
			if (endIndex === undefined && headingStartInfo !== undefined && headingStartInfo.depth === node.depth) {
				endIndex = i;
				break;
			}
		}
	}
	if (headingStartInfo) {
		(ast as any).children = ((ast as any).children as any).slice(headingStartInfo.index + 1, endIndex);
	}
	return {
		content: unified().use(remarkStringify).stringify(ast),
		highestLevel,
	};
}

export function updateVersionPackageJson(cwd = process.cwd(), newVersion: string) {
	const rootPackageJsonPath = path.resolve(cwd, 'package.json');
	const content = fs.readFileSync(rootPackageJsonPath, 'utf8');
	const updatedContent = content.replace(/'version': '.*',$/m, `'version': '${newVersion}',`);
	fs.writeFileSync(rootPackageJsonPath, updatedContent);
}
