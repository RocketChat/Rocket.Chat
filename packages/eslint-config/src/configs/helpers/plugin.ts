import type { ESLint, Linter } from 'eslint';

export function toPlugin(plugin: unknown): ESLint.Plugin {
	if (typeof plugin !== 'object' || plugin === null) {
		throw new TypeError('Plugin must be an object');
	}

	if (!('meta' in plugin) || typeof plugin.meta !== 'object' || plugin.meta === null) {
		throw new TypeError('Plugin must have a meta property of type object');
	}

	const { meta } = plugin;

	if (!('rules' in plugin) || typeof plugin.rules !== 'object' || plugin.rules === null) {
		throw new TypeError('Plugin must have a rules property of type object');
	}

	const { rules } = plugin;

	if (!('configs' in plugin) || typeof plugin.configs !== 'object' || plugin.configs === null) {
		throw new TypeError('Plugin must have a configs property of type object');
	}

	const { configs } = plugin;

	return {
		meta,
		configs: { ...configs },
		rules: { ...rules },
	};
}

export function getRules<Plugin extends ESLint.Plugin, const K extends string>(plugin: Plugin, key: K): Linter.RulesRecord {
	if (!plugin.configs) {
		throw new TypeError('Plugin must have a configs property');
	}

	if (!(key in plugin.configs)) {
		throw new TypeError(`Plugin must have a configs.${key} property`);
	}

	const { [key]: config } = plugin.configs;

	if (config === undefined) {
		throw new TypeError(`Plugin configs.${key} must not be undefined`);
	}

	if (!('rules' in config)) {
		throw new TypeError(`Plugin configs.${key} must have a rules property`);
	}

	const { rules } = config;

	if (rules === undefined) {
		throw new TypeError(`Plugin configs.${key}.rules must not be undefined`);
	}

	return Object.entries(rules).reduce((acc, [ruleName, ruleValue]) => {
		if (ruleValue) {
			acc[ruleName] = ruleValue;
		}
		return acc;
	}, {} as Linter.RulesRecord);
}
