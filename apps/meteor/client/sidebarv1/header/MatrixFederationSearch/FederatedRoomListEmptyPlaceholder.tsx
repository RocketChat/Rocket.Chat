import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { VFC } from 'react';
import React from 'react';

import GenericNoResults from '../../../components/GenericNoResults';

const FederatedRoomListEmptyPlaceholder: VFC = () => {
	const t = useTranslation();

	return (
		<Box display='flex' justifyContent='center' height='full' backgroundColor='surface'>
			<GenericNoResults description={t('There_are_no_rooms_for_the_given_search_criteria')} />
		</Box>
	);
};

export default FederatedRoomListEmptyPlaceholder;
