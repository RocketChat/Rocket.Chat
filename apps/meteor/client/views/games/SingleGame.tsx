import { Icon, Margins, Box, Flex } from '@rocket.chat/fuselage';
import { useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useContext } from 'react';

import { IGame } from '../../../definition/IGame';
import { DispatchGameGlobalContext } from '../../contexts/GameDetailContext/GlobalState';

const SingleGame = ({ _id, title, description }: Partial<IGame>): ReactElement => {
	const { dispatch } = useContext(DispatchGameGlobalContext);
	const GameDetailRoute = useRoute('games-detail');

	const handleDetailRoute = (): void => {
		const payload = {
			id: _id,
			title,
			description,
		};
		dispatch({ type: 'ADD_DETAILS', payload });
		GameDetailRoute.push({ id: _id });
	};
	return (
		<Margins block='15px'>
			<Box display='flex' alignItems='center' justifyContent='space-between' style={{ cursor: 'pointer' }} onClick={handleDetailRoute}>
				<Flex.Item>{title}</Flex.Item>
				<Flex.Item>
					<Icon name='chevron-left' size='x20' />
				</Flex.Item>
			</Box>
		</Margins>
	);
};

export default SingleGame;
