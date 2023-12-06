import type { LayoutBlockish } from '../LayoutBlockish';
import type { ExperimentalTabElement } from '../elements/ExperimentalTabElement';

export type ExperimentalTabNavigationBlock = LayoutBlockish<{
	type: 'tab_navigation';
	tabs: readonly ExperimentalTabElement[];
}>;
