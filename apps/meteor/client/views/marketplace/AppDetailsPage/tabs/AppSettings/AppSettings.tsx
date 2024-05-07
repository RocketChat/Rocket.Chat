import { Box, FieldGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import type { ISettings } from '../../../../../../ee/client/apps/@types/IOrchestrator';
import AppSetting from './AppSetting';

const AppSettings = ({ settings }: { settings: ISettings }) => {
	const t = useTranslation();

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
