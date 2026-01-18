import fs from 'node:fs';
import path from 'node:path';

import type {
	Program,
	Node,
	CallExpression,
	MemberExpression,
	ObjectExpression,
	PropertyKey,
	Expression,
	IdentifierReference,
} from '@oxc-project/types';
import { parse, Visitor } from 'oxc-parser';

const exportCache = new Map<string, Promise<string[]>>();

export class MeteorResolver {
	private meteorProgramDir: string;

	private meteorPackagesDir: string;

	private meteorDynamicPackagesDir: string;

	private meteorManifestPath: string;

	constructor(meteorProgramDir: string) {
		this.meteorProgramDir = path.resolve(meteorProgramDir);
		this.meteorPackagesDir = path.join(this.meteorProgramDir, 'packages');
		this.meteorDynamicPackagesDir = path.join(this.meteorProgramDir, 'dynamic/node_modules/meteor');
		this.meteorManifestPath = path.join(this.meteorProgramDir, 'program.json');
	}

	getExportNames(pkgName: string): Promise<string[]> {
		const exportCacheEntry = exportCache.get(pkgName);
		if (exportCacheEntry) {
			return exportCacheEntry;
		}

		const promise = (async () => {
			const names = new Set<string>();
			const packageFile = path.join(this.meteorPackagesDir, `${pkgName}.js`);
			if (fs.existsSync(packageFile)) {
				const code = await fs.promises.readFile(packageFile, 'utf-8');
				const ast = await parse(packageFile, code);
				collectConfigExports(ast.program, names);
				collectModuleExports(ast.program, names, pkgName);
			}

			const dynamicModuleFiles = await this.getDynamicPackageModuleFiles(pkgName);
			const programs = await Promise.all(
				dynamicModuleFiles.map(async (file) => {
					const moduleCode = await fs.promises.readFile(file, 'utf-8');
					const moduleAst = await parse(file, moduleCode);
					return moduleAst.program;
				}),
			);
			for (const program of programs) {
				collectModuleExports(program, names, pkgName);
			}

			const sanitized = Array.from(names).filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
			console.log(`[meteor-packages] exports for ${pkgName}:`, sanitized);
			return sanitized;
		})();

		exportCache.set(pkgName, promise);
		return promise;
	}

	async getDynamicPackageModuleFiles(pkgName: string): Promise<string[]> {
		const dynamicRoot = path.join(this.meteorDynamicPackagesDir, pkgName);
		if (!fs.existsSync(dynamicRoot)) {
			return [];
		}

		const files: string[] = [];
		const stack = [dynamicRoot];
		while (stack.length > 0) {
			const current = stack.pop();
			if (!current) {
				continue;
			}
			let entries: fs.Dirent[] = [];
			try {
				entries = fs.readdirSync(current, { withFileTypes: true });
			} catch {
				continue;
			}

			for (const entry of entries) {
				const entryPath = path.join(current, entry.name);
				if (entry.isDirectory()) {
					stack.push(entryPath);
					continue;
				}

				if (!entry.isFile() || entry.name.endsWith('.map')) {
					continue;
				}

				const ext = path.extname(entry.name);
				if (ext === '.js' || ext === '.ts' || ext === '.tsx') {
					files.push(entryPath);
				}
			}
		}

		return files;
	}

	collectPackageEntries() {
		const manifest: { manifest?: { where: string; type: string; path: string }[] } = JSON.parse(
			fs.readFileSync(this.meteorManifestPath, 'utf-8'),
		);
		const manifestEntries = manifest && Array.isArray(manifest.manifest) ? manifest.manifest : [];
		const fromManifest = manifestEntries.filter(
			(entry) => entry.where === 'client' && entry.type === 'js' && entry.path.startsWith('packages/'),
		);
		if (fromManifest.length > 0) {
			return fromManifest;
		}

		if (!fs.existsSync(this.meteorPackagesDir)) {
			console.warn(`[meteor-packages] Meteor client packages directory missing at ${this.meteorPackagesDir}`);
			return [];
		}

		const files = [];
		let dirEntries = [];
		try {
			dirEntries = fs.readdirSync(this.meteorPackagesDir, { withFileTypes: true });
		} catch (error) {
			console.warn(`[meteor-packages] Unable to read ${this.meteorPackagesDir}`, error);
			return [];
		}

		for (const entry of dirEntries) {
			if (!entry.isFile() || !entry.name.endsWith('.js')) {
				continue;
			}
			files.push({
				path: `packages/${entry.name}`,
				where: 'client',
				type: 'js',
			});
		}

		if (files.length === 0) {
			console.warn(
				`[meteor-packages] No individual package bundles found under ${this.meteorPackagesDir}. Run 'meteor run' once to regenerate development bundles before starting Vite.`,
			);
		}

		return files;
	}
}

export function collectConfigExports(program: Program, names: Set<string>): void {
	let foundExport = false;
	const visitor = new Visitor({
		ReturnStatement(node) {
			if (foundExport) return;

			const arg = node.argument;
			if (arg && is(arg, 'ObjectExpression')) {
				collectExportsFromObjectExpression(arg, names);
				foundExport = true;
			}
		},
		AssignmentExpression(node) {
			if (foundExport) return;

			if (is(node.left, 'Identifier') && node.left.name === '__meteor_runtime_config__') {
				if (is(node.right, 'ObjectExpression')) {
					for (const prop of node.right.properties) {
						if (prop.type === 'Property' && is(prop.key, 'Identifier')) {
							names.add(prop.key.name);
						}
					}
				}
			}
		},
	});

	visitor.visit(program);
}

export function collectModuleExports(ast: Program, names: Set<string>, pkgName: string): void {
	const visitor = new Visitor({
		CallExpression(node) {
			if (isModuleExportCall(node)) {
				const [arg] = node.arguments;
				if (arg && arg.type === 'ObjectExpression') {
					collectExportsFromObjectExpression(arg, names);
				}
			}

			if (isPackageQueue(node)) {
				const fn = node.arguments[1];
				if (fn && (is(fn, 'FunctionExpression') || is(fn, 'ArrowFunctionExpression'))) {
					// The Visitor will recurse into the function body automatically.
				}
			}
		},
		AssignmentExpression(node) {
			if (is(node.left, 'Identifier')) {
				if (is(node.right, 'ObjectExpression')) {
					// collectExportsFromObjectExpression(node.right, names);
					names.add(node.left.name);
				}
				return;
			}

			if (is(node.left, 'MemberExpression')) {
				if (is(node.left.object, 'MemberExpression') && isPackageAccess(node.left.object.object)) {
					if (isSpecificPackageAccess(node.left.object, pkgName)) {
						const propName = getMemberPropertyName(node.left);
						if (propName) names.add(propName);
					}
				}
			}
		},
	});

	visitor.visit(ast);
}

function collectExportsFromObjectExpression(node: ObjectExpression, names: Set<string>): void {
	for (const prop of node.properties) {
		if (!is(prop, 'Property')) continue;
		if (prop.computed) continue;

		const keyName = getPropertyName(prop.key);

		if (keyName === 'export') {
			const { value } = prop;
			if (is(value, 'FunctionExpression') || is(value, 'ArrowFunctionExpression')) {
				if (is(value.body, 'BlockStatement')) {
					for (const stmt of value.body.body) {
						if (is(stmt, 'ReturnStatement') && is(stmt.argument, 'ObjectExpression')) {
							collectExportsFromObjectExpression(stmt.argument, names);
						}
					}
				}
			}
			continue;
		}

		if (keyName && keyName !== 'require' && keyName !== 'eagerModulePaths') {
			names.add(keyName);
		}
	}
}

function is<const T extends Node['type']>(node: Node | null | undefined, type: T): node is Extract<Node, { type: T }> {
	return node?.type === type;
}

function isModuleExportCall(node: Node): node is CallExpression & {
	callee: MemberExpression & { object: IdentifierReference & { name: 'module' }; property: IdentifierReference & { name: 'export' } };
} {
	if (node.type !== 'CallExpression') return false;
	const { callee } = node;
	return (
		is(callee, 'MemberExpression') &&
		!callee.computed &&
		is(callee.object, 'Identifier') &&
		callee.object.name === 'module' &&
		is(callee.property, 'Identifier') &&
		callee.property.name === 'export'
	);
}

function getPropertyName(key: PropertyKey): string | undefined {
	if (is(key, 'Identifier')) {
		return key.name;
	}

	if (is(key, 'Literal') && typeof key.value === 'string') {
		return key.value;
	}

	return undefined;
}

function isPackageAccess(node: Expression): node is IdentifierReference & { name: 'Package' } {
	return is(node, 'Identifier') && node.name === 'Package';
}

function isSpecificPackageAccess(node: MemberExpression, pkgName: string): boolean {
	const prop = getMemberPropertyName(node);
	return prop === pkgName;
}

function getMemberPropertyName(node: MemberExpression): string | null {
	if (is(node.property, 'Identifier') && !node.computed) {
		return node.property.name;
	}
	if (is(node.property, 'Literal') && typeof node.property.value === 'string') {
		return node.property.value;
	}
	return null;
}

function isPackageQueue(node: CallExpression): node is CallExpression & { callee: MemberExpression } {
	if (is(node.callee, 'MemberExpression') && is(node.callee.property, 'Identifier') && node.callee.property.name === 'queue') {
		return true;
	}
	return false;
}
