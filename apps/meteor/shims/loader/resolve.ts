import fs from 'node:fs';
import { createRequire, type ResolveHook } from 'node:module';
import path from 'node:path';

import { ResolverFactory } from 'oxc-resolver';

const require = createRequire(import.meta.url);

const resolver = new ResolverFactory({
	extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
	mainFiles: ['index'],
	conditionNames: ['node', 'import'],
	modules: ['node_modules', path.resolve('./node_modules'), path.resolve('../../node_modules'), path.resolve('../../packages')],
	symlinks: true,
	builtinModules: false,
	allowPackageExportsInDirectoryResolve: true,
});

const isMeteorPackage = (packageName: string): packageName is `meteor/${string}` => {
	return packageName.startsWith('meteor/');
}

const getMeteorPackagePath = (packageName: `meteor/${string}`): string => {
	// Eg: meteor/mongo -> /Users/cardoso/Developer/RocketChat/Rocket.Chat/apps/meteor/.meteor/local/build/programs/server/packages/mongo.js
	const [, pkg] = packageName.split('/');
	const pkgName = pkg.replace(/:/g, '_');

	const shimPath = path.resolve('shims/packages', `${pkgName}.js`);
	if (fs.existsSync(shimPath)) {
		return shimPath;
	}

	// Try to resolve the package path from the Meteor build directory
	const meteorProgramDir = path.resolve('.meteor/local/build/programs/server');
	const packagePath = path.join(meteorProgramDir, 'packages', `${pkgName}.js`);

	return packagePath;
};

export const resolve: ResolveHook = async function resolve(specifier, context, nextResolve) {
	console.log(`Resolving specifier: ${specifier} from parentURL: ${context.parentURL}`);
	if (!context.parentURL) {
		return nextResolve(specifier, context);
	}

	if (specifier === 'csv-parse/lib/sync') {
		return {
			url: `file://${require.resolve('csv-parse')}`,
			shortCircuit: true,
		}
	}

	if (isMeteorPackage(specifier)) {
		console.log(`Resolving Meteor package: ${specifier}`);
		const meteorPackagePath = getMeteorPackagePath(specifier);
		console.warn(`Resolved Meteor package path: ${meteorPackagePath}`);
			return {
				url: `file://${meteorPackagePath}`,
				shortCircuit: true,
				format: specifier
			};
	}

	const directory = path.dirname(new URL(context.parentURL).pathname);
	const request = specifier;
	const result = await resolver.async(directory, request);

	if (result.builtin) {
		// Let Node.js handle built-in modules
		return nextResolve(specifier, context);
	}

	if (result.path) {
		console.info(`Resolved ${specifier} to ${result.path}`);
		return {
			url: `file://${result.path}`,
			shortCircuit: true,
		};
	}

	if (result.error) {
		console.warn(`Resolution error for ${specifier}: ${result.error}`);
	}

	// Fallback to Node.js resolution
	return nextResolve(specifier, context);
}