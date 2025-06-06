import { Box, Label } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { Controller, useFormContext } from 'react-hook-form';
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

type AppLogsFilterContextualBarProps = {
	onClose: () => void;
};

const AppLogsFilterContextualBar = ({ onClose = () => undefined }: AppLogsFilterContextualBarProps) => {
	const { t } = useTranslation();

	const { control } = useFormContext();

	const formId = useUniqueId();

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='customize' />
				<ContextualbarTitle>{t('Filters')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent is='form' id={formId}>
				<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
					<Label htmlFor='timeFilter'>{t('Time')}</Label>
					<TimeFilterSelect id='timeFilter' compactView={true} />
				</Box>
				<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
					<Label htmlFor='timeFilter'>{t('Logs_from')}</Label>
					<DateTimeFilter control={control} type='start' />
				</Box>
				<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
					<Label htmlFor='timeFilter'>{t('Until')}</Label>
					<DateTimeFilter control={control} type='end' />
				</Box>
				<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
					<Label htmlFor='instanceFilter'>{t('Instance')}</Label>
					<Controller control={control} name='instance' render={({ field }) => <InstanceFilterSelect id='instanceFilter' {...field} />} />
				</Box>
				<Box display='flex' flexDirection='column' mie='x10' flexGrow={1}>
					<Label>{t('Severity')}</Label>
					<Controller control={control} name='severity' render={({ field }) => <SeverityFilterSelect id='severityFilter' {...field} />} />
				</Box>
			</ContextualbarScrollableContent>
		</ContextualbarDialog>
	);
};

export default AppLogsFilterContextualBar;
