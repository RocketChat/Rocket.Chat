import { Button, IconButton, Label, Stack } from '@rocket.chat/fuselage';
import { useRouter, useSetModal } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
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
	const eventField = useId();
	const timeField = useId();
	const instanceField = useId();
	const severityField = useId();

	return (
		<Stack direction='row' wrap align='end' gap='x8'>
			<Stack grow>
				<Label htmlFor={eventField}>{t('Event')}</Label>
				<Controller control={control} name='event' render={({ field }) => <EventFilterSelect {...field} appId={appId} id={eventField} />} />
			</Stack>
			{!compactMode && (
				<>
					<Stack grow>
						<Label htmlFor={timeField}>{t('Time')}</Label>
						<TimeFilterSelect id={timeField} />
					</Stack>
					<Stack grow>
						<Label htmlFor={instanceField}>{t('Instance')}</Label>
						<Controller
							control={control}
							name='instance'
							render={({ field }) => <InstanceFilterSelect appId={appId} id={instanceField} {...field} />}
						/>
					</Stack>
					<Stack grow>
						<Label htmlFor={severityField}>{t('Severity')}</Label>
						<Controller control={control} name='severity' render={({ field }) => <SeverityFilterSelect id={severityField} {...field} />} />
					</Stack>
					<IconButton
						title={isLoading ? t('Loading') : t('Refresh_logs')}
						disabled={isLoading}
						icon='refresh'
						variant='secondary'
						onClick={() => refreshLogs()}
					/>
					<IconButton
						title={noResults ? t('No_data_to_export') : t('Export')}
						icon='circle-arrow-down'
						disabled={noResults}
						variant='secondary'
						onClick={() => openExportModal()}
						aria-label={noResults ? t('No_data_to_export') : t('Export')}
						aria-disabled={noResults}
					/>
					<AppsLogsFilterOptions onExpandAll={openAllLogs} onCollapseAll={collapseAll} />
				</>
			)}
			{compactMode && (
				<>
					<Button icon='customize' variant='secondary' onClick={() => openContextualBar()}>
						{t('Filters')}
					</Button>
					<CompactFilterOptions
						isLoading={isLoading}
						onExportLogs={openExportModal}
						onExpandAll={openAllLogs}
						onCollapseAll={collapseAll}
						onRefreshLogs={refreshLogs}
					/>
				</>
			)}
		</Stack>
	);
};
