import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { CARD_TOTAL_HEIGHT } from './Card';
import { SECTION_MAX_HEIGHT } from './CardListSection';
import { ACTION_STRIP_TOTAL_HEIGHT } from '../Actions/ActionStrip';

// The minimum height that will fit 2 cards on top of each other alongside the given number of action strips
const getWrapMinHeight = (actionStripCount: number) => CARD_TOTAL_HEIGHT * 2 + ACTION_STRIP_TOTAL_HEIGHT * actionStripCount;

export const SECTION_MIN_HEIGHT_WRAP_COLLAPSED = getWrapMinHeight(1) / (SECTION_MAX_HEIGHT / 100);

/**
 * Whether the section is tall enough to stack the two peer cards.
 *
 * `actionStripCount` is the number of action strips sharing the section's height with the cards.
 */
export const useShouldWrapCards = (showChat: boolean, containerHeight: number, actionStripCount = 1) => {
	const minHeight = getWrapMinHeight(actionStripCount);
	const shouldWrapCollapsed = useMediaQuery(`(min-height: ${minHeight / (SECTION_MAX_HEIGHT / 100)}px)`);
	return showChat ? shouldWrapCollapsed : containerHeight > minHeight;
};
