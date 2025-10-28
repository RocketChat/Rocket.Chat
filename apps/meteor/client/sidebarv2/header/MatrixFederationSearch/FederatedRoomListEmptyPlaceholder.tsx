import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../../components/GenericNoResults';

const FederatedRoomListEmptyPlaceholder = () => {
	const { t } = useTranslation();

	return (
		<Box display='flex' justifyContent='center' height='full' backgroundColor='surface'>
			<GenericNoResults description={t('There_are_no_rooms_for_the_given_search_criteria')} />
		</Box>
	);
};

export default FederatedRoomListEmptyPlaceholder;
