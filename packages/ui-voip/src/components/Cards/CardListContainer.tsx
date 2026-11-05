import type { ReactNode } from 'react';

import CardList from './CardList.js';
import CardListPinned from './CardListPinned.js';

export type CardListContainerProps = {
	children: ReactNode;
	focusedCard?: ReactNode;
	shouldWrapCards?: boolean;
};

const CardListContainer = ({ children, focusedCard, shouldWrapCards }: CardListContainerProps) => {
	if (focusedCard) {
		return (
			<CardListPinned focusedCard={focusedCard} flexDirection='row'>
				{children}
			</CardListPinned>
		);
	}
	return (
		<CardList shouldWrapCards={shouldWrapCards} marginInline='auto'>
			{children}
		</CardList>
	);
};

export default CardListContainer;
