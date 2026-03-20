import type { ReactNode } from 'react';

import CardList from './CardList';
import CardListPinned from './CardListPinned';

type CardListContainerProps = {
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
