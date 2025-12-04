import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useRoomAttributeItems } from './useRoomAttributeOptions';

type AdminABACRoomAttributeMenuProps = {
	attribute: { _id: string; key: string };
};

const AdminABACRoomAttributeMenu = ({ attribute }: AdminABACRoomAttributeMenuProps) => {
	const { t } = useTranslation();

	const items = useRoomAttributeItems(attribute);

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

export default AdminABACRoomAttributeMenu;
