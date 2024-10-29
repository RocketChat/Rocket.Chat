import type { App } from '@rocket.chat/core-typings';
import { Box, FieldGroup } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AppSetting from './AppSetting';
import { useAppSettingsQuery } from '../../../hooks/useAppSettingsQuery';

type AppSettingsProps = {
	appId: App['id'];
};

const AppSettings = ({ appId }: AppSettingsProps) => {
	const { isSuccess, data } = useAppSettingsQuery(appId, {
		select: (data) => Object.values(data),
	});
	const { t } = useTranslation();

	return (
		<>
			<Box display='flex' flexDirection='column' maxWidth='x640' w='full' marginInline='auto'>
				<Box fontScale='h4' mb={12}>
					{t('Settings')}
				</Box>
				{isSuccess && (
					<FieldGroup>
						{data.map((field) => (
							<AppSetting key={field.id} appId={appId} {...field} />
						))}
					</FieldGroup>
				)}
			</Box>
		</>
	);
};

export default AppSettings;
