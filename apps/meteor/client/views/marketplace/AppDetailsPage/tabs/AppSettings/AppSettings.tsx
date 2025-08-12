import { Box, FieldGroup, Accordion, AccordionItem } from '@rocket.chat/fuselage';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import AppSetting from './AppSetting';
import type { ISettings } from '../../../../../apps/@types/IOrchestrator';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

const AppSettings = ({ settings }: { settings: ISettings }) => {
	const appId = useRouteParameter('id');
	const tApp = useAppTranslation(appId || '');

	const groupedSettings = useMemo(() => {
		const groups = Object.values(settings).reduce(
			(acc, setting) => {
				const section = setting.section || 'general';
				if (!acc[section]) {
					acc[section] = [];
				}
				acc[section].push(setting);
				return acc;
			},
			{} as Record<string, (typeof settings)[keyof typeof settings][]>,
		);

		return Object.entries(groups);
	}, [settings]);

	return (
		<Box display='flex' flexDirection='column' maxWidth='x640' w='full' marginInline='auto'>
			<Accordion>
				{groupedSettings.map(([section, sectionSettings], index) => (
					<AccordionItem key={section} title={tApp(section)} defaultExpanded={index === 0}>
						<FieldGroup>
							{sectionSettings.map((field) => (
								<AppSetting key={field.id} {...field} />
							))}
						</FieldGroup>
					</AccordionItem>
				))}
			</Accordion>
		</Box>
	);
};

export default AppSettings;
