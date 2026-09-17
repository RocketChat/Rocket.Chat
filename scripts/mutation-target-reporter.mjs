import { commonTokens, declareClassPlugin, PluginKind } from '@stryker-mutator/api/plugin';

class MutationTargetReporter {
	static inject = [commonTokens.fileDescriptions];

	constructor(files) {
		// Use Stryker's selected files so globs, exclusions, and line ranges keep their native semantics.
		if (!Object.values(files).some(({ mutate }) => mutate)) {
			throw new Error('No production files matched the mutation scope. Check --mutate paths relative to the selected package.');
		}
	}
}

export const strykerPlugins = [declareClassPlugin(PluginKind.Reporter, 'mutation-targets', MutationTargetReporter)];
