import { Box, States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { VFC } from 'react';
import React from 'react';

const FederatedRoomListEmptyPlaceholder: VFC = () => {
	const t = useTranslation();

	return (
		<Box display='flex' justifyContent='center' height='full' backgroundColor='surface'>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t('No_results_found')}</StatesTitle>
				<StatesSubtitle>{t('There_are_no_rooms_for_the_given_search_criteria')}</StatesSubtitle>
			</States>
		</Box>
	);
};

export default FederatedRoomListEmptyPlaceholder;
