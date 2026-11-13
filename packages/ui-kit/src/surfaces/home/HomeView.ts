import typia from 'typia';

import type { View } from '../View.js';
import type { HomeSurfaceLayout } from './UiKitParserHome.js';

/**
 * A page an app keeps up to date for each user, displayed from the app's entry in the Marketplace.
 */
// Omitting `blocks` from `View` because array intersections are weird
export type HomeView = Omit<View, 'blocks'> & {
	id: string;
	blocks: HomeSurfaceLayout;
	/** Opaque data the app gets back with every interaction on the view. */
	private_metadata?: string;
	/** An identifier the app chooses to find the view again. */
	external_id?: string;
};

export const isHomeView = typia.createIs<HomeView>();
