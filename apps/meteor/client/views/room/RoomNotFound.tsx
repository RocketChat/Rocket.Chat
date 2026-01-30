import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import RoomLayout from './layout/RoomLayout';
import NotFoundState from '../../components/NotFoundState';

const RoomNotFound = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<RoomLayout
			body={
				<Box display='flex' justifyContent='center' height='full'>
					<NotFoundState title={t('Room_not_found')} subtitle={t('Room_not_exist_or_not_permission')} />
				</Box>
			}
		/>
	);
};

export default RoomNotFound;
