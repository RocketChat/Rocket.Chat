import { Box, Label } from '@rocket.chat/fuselage';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import DateTimeFilter from './DateTimeFilter';
import { InstanceFilterSelect } from './InstanceFilterSelect';
import { SeverityFilterSelect } from './SeverityFilterSelect';
import { TimeFilterSelect } from './TimeFilterSelect';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarDialog,
} from '../../../../../../components/Contextualbar';
import { useAppLogsFilterFormContext } from '../useAppLogsFilterForm';

type AppLogsFilterContextualBarProps = {
	appId: string;
	onClose: () => void;
};

export const AppLogsFilterContextualBar = ({ appId, onClose = () => undefined }: AppLogsFilterContextualBarProps) => {
	const { t } = useTranslation();

	const { control } = useAppLogsFilterFormContext();

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='customize' />
				<ContextualbarTitle>{t('Filters')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent is='form'>
				<Box display='flex' flexDirection='column' mie={10} flexGrow={1}>
					<Label id='timeFilterLabel' htmlFor='timeFilter'>
						{t('Time')}
					</Label>
					<TimeFilterSelect aria-labelledby='timeFilterLabel' id='timeFilter' compactView={true} />
				</Box>
				<Box display='flex' flexDirection='column' mie={10} flexGrow={1}>
					<Label htmlFor='timeFilter'>{t('Logs_from')}</Label>
					<DateTimeFilter control={control} type='start' />
				</Box>
				<Box display='flex' flexDirection='column' mie={10} flexGrow={1}>
					<Label htmlFor='timeFilter'>{t('Until')}</Label>
					<DateTimeFilter control={control} type='end' />
				</Box>
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
				<Box display='flex' flexDirection='column' mie={10} flexGrow={1}>
					<Label id='severityFilterLabel' htmlFor='severityFilter'>
						{t('Severity')}
					</Label>
					<Controller
						control={control}
						name='severity'
						render={({ field }) => <SeverityFilterSelect aria-labelledby='severityFilterLabel' id='severityFilter' {...field} />}
					/>
				</Box>
			</ContextualbarScrollableContent>
		</ContextualbarDialog>
	);
};
