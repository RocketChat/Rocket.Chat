import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import type { CSSProperties, ReactNode } from 'react';

import { CARD_MARGIN, CARD_MIN_WIDTH } from './Card';
import CardListContainer from './CardList';

type CardListPinnedProps = {
	children: ReactNode;
	focusedCard: ReactNode;
	flexDirection?: CSSProperties['flexDirection'];
};

// This is a workaround to center the card list when it's not overflowing yet.
const scrollbarContainerStyle = css`
	[data-overlayscrollbars-viewport] {
		display: flex;
	}
`;

const CardListPinned = ({ children, focusedCard, flexDirection = 'row' }: CardListPinnedProps) => {
	return (
		<Box display='flex' flexDirection={flexDirection} justifyContent='center' alignItems='center' height='100%' width='100%'>
			<Box
				display='flex'
				flexGrow={1}
				flexShrink={1}
				width='100%'
				height='100%'
				alignItems='center'
				justifyContent='center'
				flexDirection='column'
			>
				{focusedCard}
			</Box>

			<Box
				display='flex'
				overflow='auto'
				justifyContent='stretch'
				alignItems='start'
				flexDirection='row'
				height='100%'
				flexShrink={0}
				width={CARD_MIN_WIDTH + CARD_MARGIN * 2}
				className={scrollbarContainerStyle}
			>
				<CustomScrollbars>
					<CardListContainer autoMargin overflow='hidden' direction={flexDirection === 'row' ? 'column' : 'row'}>
						{children}
					</CardListContainer>
				</CustomScrollbars>
			</Box>
		</Box>
	);
};

export default CardListPinned;
