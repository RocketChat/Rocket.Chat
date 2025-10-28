import { Box, Button, IconButton, Label } from '@rocket.chat/fuselage';
import { useRouter, useSetModal } from '@rocket.chat/ui-contexts';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AppsLogsFilterOptions from './AppLogsFilterOptions';
import CompactFilterOptions from './CompactFilterOptions';
import { EventFilterSelect } from './EventFilterSelect';
import { InstanceFilterSelect } from './InstanceFilterSelect';
import { SeverityFilterSelect } from './SeverityFilterSelect';
import { TimeFilterSelect } from './TimeFilterSelect';
import { useCompactMode } from '../../../useCompactMode';
import { useAppLogsFilterFormContext } from '../useAppLogsFilterForm';
import { ExportLogsModal } from './ExportLogsModal';

type AppsLogsFilterProps = {
	appId: string;
	expandAll: () => void;
	collapseAll: () => void;
	refetchLogs: () => void;
	isLoading: boolean;
	noResults?: boolean;
};

export const AppLogsFilter = ({ appId, expandAll, collapseAll, refetchLogs, isLoading, noResults = false }: AppsLogsFilterProps) => {
	const { t } = useTranslation();

	const { control, getValues } = useAppLogsFilterFormContext();

	const setModal = useSetModal();

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

	const onExportConfirm = (url: string) => {
		window.open(url, '_blank', 'noopener noreferrer');
	};

	const openExportModal = () => {
		setModal(<ExportLogsModal onClose={() => setModal(null)} filterValues={getValues()} onConfirm={onExportConfirm} />);
	};

	const compactMode = useCompactMode();

	return (
		<Box display='flex' flexDirection='row' width='full' flexWrap='wrap' alignContent='flex-end'>
			<Box display='flex' flexDirection='column' mie={10} flexGrow={1}>
				<Label id='eventFilterLabel' htmlFor='eventFilter'>
					{t('Event')}
				</Label>
				<Controller
					control={control}
					name='event'
					render={({ field }) => <EventFilterSelect appId={appId} aria-labelledby='eventFilterLabel' id='eventFilter' {...field} />}
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
						render={({ field }) => (
							<InstanceFilterSelect appId={appId} aria-labelledby='instanceFilterLabel' id='instanceFilter' {...field} />
						)}
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
			{!compactMode && (
				<IconButton
					title={noResults ? t('No_data_to_export') : t('Export')}
					alignSelf='flex-end'
					icon='circle-arrow-down'
					disabled={noResults}
					secondary
					mie={10}
					onClick={() => openExportModal()}
					aria-label={noResults ? t('No_data_to_export') : t('Export')}
					aria-disabled={noResults}
				/>
			)}
			{compactMode && (
				<Button alignSelf='flex-end' icon='customize' secondary mie={10} onClick={() => openContextualBar()}>
					{t('Filters')}
				</Button>
			)}
			{!compactMode && <AppsLogsFilterOptions onExpandAll={openAllLogs} onCollapseAll={collapseAll} />}
			{compactMode && (
				<CompactFilterOptions
					isLoading={isLoading}
					onExportLogs={openExportModal}
					onExpandAll={openAllLogs}
					onCollapseAll={collapseAll}
					onRefreshLogs={refreshLogs}
				/>
			)}
		</Box>
	);
};
