import type { App } from '@rocket.chat/core-typings';

export function doesAppRequireAddon(app: App): boolean {
	const { categories } = app;

	// Phase 1 validation
	return categories?.includes('Add-on');
}
