import { Box, Divider } from '@rocket.chat/fuselage';
import type { CSSProperties, ReactNode } from 'react';

import CardListContainer from './CardListContainer';

type CardListContainerPinnedProps = {
	children: ReactNode;
	focusedCard: ReactNode;
	flexDirection?: CSSProperties['flexDirection'];
};

const getDividerSize = (flexDirection: CSSProperties['flexDirection']) => {
	if (flexDirection === 'row') {
		return { height: '100%', pb: 16 };
	}

	return { width: '100%', pi: 16 };
};

const getStreamSectionPadding = (flexDirection: CSSProperties['flexDirection']) => {
	if (flexDirection === 'row') {
		return { pie: 4 };
	}

	return { pbe: 4 };
};

const CardListContainerPinned = ({ children, focusedCard, flexDirection = 'row' }: CardListContainerPinnedProps) => {
	return (
		<Box display='flex' flexDirection={flexDirection} justifyContent='center' alignItems='center' height='100%' width='100%'>
			<Box
				display='flex'
				flexGrow={1}
				flexShrink={0}
				overflow='auto'
				justifyContent='stretch'
				alignItems='start'
				flexDirection='row'
				height='100%'
			>
				<CardListContainer autoMargin overflow='hidden' direction={flexDirection === 'row' ? 'column' : 'row'}>
					{children}
				</CardListContainer>
			</Box>
			<Box
				display='flex'
				alignItems='center'
				justifyContent='center'
				flexDirection={flexDirection === 'row' ? 'column' : 'row'}
				height='100%'
				{...getDividerSize(flexDirection)}
			>
				<Divider vertical={flexDirection === 'row'} {...getDividerSize(flexDirection)} m={4} />
			</Box>
			<Box
				display='flex'
				flexGrow={1}
				flexShrink={1}
				width='100%'
				height='100%'
				alignItems='center'
				justifyContent='center'
				flexDirection='column'
				{...getStreamSectionPadding(flexDirection)}
			>
				{focusedCard}
			</Box>
		</Box>
	);
};

export default CardListContainerPinned;
