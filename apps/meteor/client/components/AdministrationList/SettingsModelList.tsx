import { OptionTitle } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import ListItem from '../Sidebar/ListItem';

type SettingsModelListProps = {
	closeList: () => void;
};

const SettingsModelList: FC<SettingsModelListProps> = ({ closeList }) => {
	const t = useTranslation();
	const settingsRoute = useRoute('admin-settings');

	return (
		<>
			<OptionTitle>{t('Settings')}</OptionTitle>
			<ul>
				<ListItem
					icon='customize'
					text={t('Workspace_settings')}
					action={(): void => {
						settingsRoute.push();
						closeList();
					}}
				/>
			</ul>
		</>
	);
};

export default SettingsModelList;
