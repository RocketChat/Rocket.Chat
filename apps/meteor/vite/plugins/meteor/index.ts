import type * as vite from 'vite';

import { packages } from './plugins/packages.ts';
import { proxy } from './plugins/proxy.ts';
import { runtime } from './plugins/runtime.ts';
import { resolveConfig, type PluginOptions } from './plugins/shared/config.ts';
import { stubs } from './plugins/stubs.ts';

export default function meteorPlugin(pluginConfig: PluginOptions = {}): vite.Plugin[] {
	const resolvedConfig = resolveConfig(pluginConfig);
	return [packages(resolvedConfig), runtime(resolvedConfig), stubs(resolvedConfig), proxy(resolvedConfig)];
}
