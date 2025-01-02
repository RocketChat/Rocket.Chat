import type { App } from '@rocket.chat/core-typings';
import { Box, FieldGroup, Accordion, AccordionItem } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import AppSetting from './AppSetting';
import { useAppSettingsQuery } from '../../../hooks/useAppSettingsQuery';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

type AppSettingsProps = {
	appId: App['id'];
};

const AppSettings = ({ appId }: AppSettingsProps) => {
	const { isSuccess, data } = useAppSettingsQuery(appId, {
		select: (data) => {
			const groups = Object.values(data).reduce(
				(acc, setting) => {
					const section = setting.section || 'general';
					if (!acc[section]) {
						acc[section] = [];
					}
					acc[section].push(setting);
					return acc;
				},
				{} as Record<string, (typeof data)[keyof typeof data][]>,
			);

			return Object.entries(groups);
		},
	});
	const { t } = useTranslation();
	const tApp = useAppTranslation(appId || '');

	return (
		<Box display='flex' flexDirection='column' maxWidth='x640' w='full' marginInline='auto'>
			<Box fontScale='h4' mb={12}>
				{t('Settings')}
			</Box>
			{isSuccess && (
				<Accordion>
					{data.map(([section, sectionSettings], index) => (
						<AccordionItem key={section} title={tApp(section)} defaultExpanded={index === 0}>
							<FieldGroup>
								{sectionSettings.map((field) => (
									<AppSetting key={field.id} appId={appId} {...field} />
								))}
							</FieldGroup>
						</AccordionItem>
					))}
				</Accordion>
			)}
		</Box>
	);
};

export default AppSettings;
