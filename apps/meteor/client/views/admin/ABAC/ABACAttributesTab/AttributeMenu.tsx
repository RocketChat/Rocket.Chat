import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useAttributeOptions } from '../hooks/useAttributeOptions';

type AttributeMenuProps = {
	attribute: { _id: string; key: string };
};

const AttributeMenu = ({ attribute }: AttributeMenuProps) => {
	const { t } = useTranslation();

	const items = useAttributeOptions(attribute);

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

export default AttributeMenu;
