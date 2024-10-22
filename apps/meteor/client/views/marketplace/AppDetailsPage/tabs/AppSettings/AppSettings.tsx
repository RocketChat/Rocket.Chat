import { Box, FieldGroup } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { ISettings } from '../../../../../apps/@types/IOrchestrator';
import AppSetting from './AppSetting';

const AppSettings = ({ settings }: { settings: ISettings }) => {
	const { t } = useTranslation();

	return (
		<>
			<Box display='flex' flexDirection='column' maxWidth='x640' w='full' marginInline='auto'>
				<Box fontScale='h4' mb={12}>
					{t('Settings')}
				</Box>
				<FieldGroup>
					{Object.values(settings).map((field) => (
						<AppSetting key={field.id} {...field} />
					))}
				</FieldGroup>
			</Box>
		</>
	);
};

export default AppSettings;
