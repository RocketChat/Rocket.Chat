import { Box, Button, Icon, IconButton, Label, Palette, TextInput } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import CompactFilterOptions from './AppsLogsFilterOptionsCompact';
import { InstanceFilterSelect } from './InstanceFilterSelect';
import { SeverityFilterSelect } from './SeverityFilterSelect';
import { TimeFilterSelect } from './TimeFilterSelect';
import { useCompactMode } from '../../../useCompactMode';
import { useAppLogsFilterFormContext } from '../useAppLogsFilterForm';

type AppsLogsFilterProps = {
	expandAll: () => void;
	refetchLogs: () => void;
	isLoading: boolean;
};

export const AppLogsFilter = ({ expandAll, refetchLogs, isLoading }: AppsLogsFilterProps) => {
	const { t } = useTranslation();

	const { control } = useAppLogsFilterFormContext();

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

	const openAllLogs = () => expandAll();

	const refreshLogs = () => {
		refetchLogs();
	};

	const compactMode = useCompactMode();

	return (
		<Box display='flex' flexDirection='row' width='full' flexWrap='wrap' alignContent='flex-end'>
			<Box display='flex' flexDirection='column' mie={10} flexGrow={1}>
				<Label htmlFor='eventFilter'>{t('Event')}</Label>
				<Controller
					control={control}
					name='event'
					render={({ field }) => (
						<TextInput
							addon={<Icon color={Palette.text['font-secondary-info']} name='magnifier' size={20} />}
							id='eventFilter'
							{...field}
						/>
					)}
				/>
			</Box>
			{!compactMode && (
				<Box display='flex' flexDirection='column' mie={10} flexGrow={1}>
					<Label id='timeFilterLabel' htmlFor='timeFilter'>
						{t('Time')}
					</Label>
					<TimeFilterSelect id='timeFilter' aria-labelledby='timeFilterLabel' />
				</Box>
			)}
			{!compactMode && (
				<Box display='flex' flexDirection='column' mie={10} flexGrow={1}>
					<Label id='instanceFilterLabel' htmlFor='instanceFilter'>
						{t('Instance')}
					</Label>
					<Controller
						control={control}
						name='instance'
						render={({ field }) => <InstanceFilterSelect aria-labelledby='instanceFilterLabel' id='instanceFilter' {...field} />}
					/>
				</Box>
			)}
			{!compactMode && (
				<Box display='flex' flexDirection='column' mie={10} flexGrow={1}>
					<Label>{t('Severity')}</Label>
					<Controller control={control} name='severity' render={({ field }) => <SeverityFilterSelect id='severityFilter' {...field} />} />
				</Box>
			)}
			{!compactMode && (
				<Button alignSelf='flex-end' icon='arrow-expand' secondary mie={10} onClick={() => openAllLogs()}>
					{t('Expand_all')}
				</Button>
			)}
			{!compactMode && (
				<IconButton
					title={isLoading ? t('Loading') : t('Refresh_logs')}
					alignSelf='flex-end'
					disabled={isLoading}
					icon='refresh'
					secondary
					mie={10}
					onClick={() => refreshLogs()}
				/>
			)}
			{compactMode && (
				<Button alignSelf='flex-end' icon='customize' secondary mie={10} onClick={() => openContextualBar()}>
					{t('Filters')}
				</Button>
			)}
			{compactMode && <CompactFilterOptions isLoading={isLoading} handleExpandAll={openAllLogs} handleRefreshLogs={refreshLogs} />}
		</Box>
	);
};
