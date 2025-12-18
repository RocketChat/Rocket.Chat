import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useRoomItems } from '../hooks/useRoomItems';

type RoomMenuProps = {
	room: { rid: string; name: string };
};

const RoomMenu = ({ room }: RoomMenuProps) => {
	const { t } = useTranslation();

	const items = useRoomItems(room);

	return (
		<GenericMenu
			title={t('Options')}
			icon='kebab'
			sections={[
				{
					items,
				},
			]}
		/>
	);
};

export default RoomMenu;
