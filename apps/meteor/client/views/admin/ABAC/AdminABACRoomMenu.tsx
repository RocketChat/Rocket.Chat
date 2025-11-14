import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import useRoomItems from './hooks/useRoomItems';

type AdminABACRoomMenuProps = {
	room: { rid: string; name: string };
};

const AdminABACRoomMenu = ({ room }: AdminABACRoomMenuProps) => {
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

export default AdminABACRoomMenu;
