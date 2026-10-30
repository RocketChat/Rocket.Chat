import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { ExperimentalTabElement } from '../elements/ExperimentalTabElement.js';

export type ExperimentalTabNavigationBlock = LayoutBlockish<{
	type: 'tab_navigation';
	tabs: readonly ExperimentalTabElement[];
}>;
