import { Box, Button, Icon, Label, Palette, TextInput } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { InstanceFilterSelect } from './InstanceFilterSelect';
import { SeverityFilterSelect } from './SeverityFilterSelect';
import { TimeFilterSelect } from './TimeFilterSelect';

export const AppLogsFilter = () => {
	const { t } = useTranslation();

	const { control } = useFormContext();

	const router = useRouter();

	const openContextualBar = () => {
		router.navigate(
			{
				name: 'marketplace',
				params: { ...router.getRouteParameters(), contextualBar: 'filter-logs' },
			},
			{ replace: true },
		);
	};

	const breakpoint = useBreakpoints(); // ["xs", "sm", "md", "lg", "xl", xxl"]
	const compactMode = !breakpoint.includes('lg');

	return (
		<Box display='flex' flexDirection='row' width='full' flexWrap='wrap' alignContent='flex-end'>
			<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
				<Label htmlFor='eventFilter'>{t('Event')}</Label>
				<Controller
					control={control}
					name='event'
					render={({ field }) => (
						<TextInput
							addon={<Icon color={Palette.text['font-secondary-info']} name='magnifier' size='x20' />}
							id='eventFilter'
							{...field}
						/>
					)}
				/>
			</Box>
			{!compactMode && (
				<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
					<Label htmlFor='instanceFilter'>{t('Instance')}</Label>
					<Controller control={control} name='instance' render={({ field }) => <InstanceFilterSelect id='instanceFilter' {...field} />} />
				</Box>
			)}
			{!compactMode && (
				<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
					<Label htmlFor='timeFilter'>{t('Time')}</Label>
					<TimeFilterSelect id='timeFilter' />
				</Box>
			)}
			{!compactMode && (
				<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
					<Label>{t('Severity')}</Label>
					<Controller control={control} name='severity' render={({ field }) => <SeverityFilterSelect id='severityFilter' {...field} />} />
				</Box>
			)}
			{compactMode && (
				<Button alignSelf='flex-end' icon='customize' secondary mie='x10' onClick={() => openContextualBar()}>
					{t('Filters')}
				</Button>
			)}
		</Box>
	);
};
