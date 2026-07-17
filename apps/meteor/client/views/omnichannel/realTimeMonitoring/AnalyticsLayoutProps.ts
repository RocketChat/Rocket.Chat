import type { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * Layout props the analytics dashboards inject into their grid items
 * (charts and counter overviews). Bounded on purpose — do NOT widen this to the
 * full Box style surface. The deeper fix is for the page to own the grid layout
 * so these items don't take layout props at all.
 */
export type AnalyticsGridItemProps = Pick<
	ComponentPropsWithoutRef<typeof Box>,
	'flexGrow' | 'flexShrink' | 'width' | 'marginInlineEnd' | 'marginInlineStart'
>;
