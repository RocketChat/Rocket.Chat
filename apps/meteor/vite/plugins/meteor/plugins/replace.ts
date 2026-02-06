import { replacePlugin } from 'rolldown/plugins';
import type { PluginOption } from 'vite';

import type { ResolvedPluginOptions } from './shared/config';

export function replace(resolvedConfig: ResolvedPluginOptions): PluginOption {
	return [
		replacePlugin({
			'Meteor.isClient': `${resolvedConfig.isClient}`,
			'Meteor.isServer': `${!resolvedConfig.isClient}`,
			'Meteor.isDevelopment': `${process.env.NODE_ENV !== 'production'}`,
			'Meteor.isProduction': `${process.env.NODE_ENV === 'production'}`,
			'Meteor.isCordova': 'false',
			'Meteor.isSimulation': 'false',
			'process.env.TEST_MODE': 'false',
			'process.env.NODE_DEBUG': 'false',
			'process.env.DEBUG_MIME': 'false',
			'process.platform': JSON.stringify('browser'),
			'TEST_METADATA.driverPackage': 'false',
			'Package.promise.Promise': 'globalThis.Promise',
			'Package.meteor.global': 'globalThis',
			'process': 'undefined',
		}),
		replacePlugin(
			{
				'Meteor.isTest': 'false',
				'Meteor.isAppTest': 'false',
				'Meteor.isPackageTest': 'false',
			},
			{ preventAssignment: true },
		),
	];
}
