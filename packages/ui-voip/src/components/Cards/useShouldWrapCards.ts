import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { SECTION_MAX_HEIGHT } from './CardListSection';
import { CARD_TOTAL_HEIGHT } from './GenericCard';
import { ACTION_STRIP_TOTAL_HEIGHT } from '../Actions/ActionStrip';

// The minimun height that will fit 2 cards on top of eachother
export const SECTION_MIN_HEIGHT_WRAP_COLLAPSED = (CARD_TOTAL_HEIGHT * 2 + ACTION_STRIP_TOTAL_HEIGHT) / (SECTION_MAX_HEIGHT / 100);

export const useShouldWrapCards = (showChat: boolean, containerHeight: number) => {
	const shouldWrapCollapsed = useMediaQuery(`(min-height: ${SECTION_MIN_HEIGHT_WRAP_COLLAPSED}px)`);
	return showChat ? shouldWrapCollapsed : containerHeight > CARD_TOTAL_HEIGHT * 2;
};
