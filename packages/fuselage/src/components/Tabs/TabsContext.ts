import { createContext } from 'react';

export type TabsOptions = {
	divider: boolean;
	stretch: boolean;
};

/** What `Tabs` tells its items: whether the bar has a divider they overlap, and whether they grow to fill it. */
export const TabsContext = createContext<TabsOptions>({ divider: false, stretch: false });

const known: Record<`${boolean}|${boolean}`, TabsOptions> = {
	'true|true': { divider: true, stretch: true },
	'true|false': { divider: true, stretch: false },
	'false|true': { divider: false, stretch: true },
	'false|false': { divider: false, stretch: false },
};

/** One value per pair, so the items that read it do not re-render when their bar does. */
export const tabsValue = (divider: boolean, stretch: boolean): TabsOptions => known[`${divider}|${stretch}`];
