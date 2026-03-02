import type { ReactNode } from 'react';

import CardListContainer from './CardListContainer';
import CardListContainerPinned from './CardListContainerPinned';

type CardListContainerWrapperProps = {
	children: ReactNode;
	focusedCard?: ReactNode;
	shouldWrapCards?: boolean;
};

const CardListContainerWrapper = ({ children, focusedCard, shouldWrapCards }: CardListContainerWrapperProps) => {
	if (focusedCard) {
		return (
			<CardListContainerPinned focusedCard={focusedCard} flexDirection='row'>
				{children}
			</CardListContainerPinned>
		);
	}
	return (
		<CardListContainer shouldWrapCards={shouldWrapCards} marginInline='auto'>
			{children}
		</CardListContainer>
	);
};

export default CardListContainerWrapper;
