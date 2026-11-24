import { Button, ButtonGroup, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarDialog,
	ContextualbarFooter,
} from '@rocket.chat/ui-client';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import DateTimeFilter from './DateTimeFilter';
import { InstanceFilterSelect } from './InstanceFilterSelect';
import { SeverityFilterSelect } from './SeverityFilterSelect';
import { TimeFilterSelect } from './TimeFilterSelect';
import { useAppLogsFilterFormContext } from '../useAppLogsFilterForm';

export type AppLogsFilterContextualBarProps = {
	appId: string;
	onClose: () => void;
};

export const AppLogsFilterContextualBar = ({ appId, onClose = () => undefined }: AppLogsFilterContextualBarProps) => {
	const { t } = useTranslation();

	const { control, reset } = useAppLogsFilterFormContext();

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='customize' />
				<ContextualbarTitle>{t('Filters')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent is='form'>
				<Field>
					<FieldLabel id='timeFilterLabel' htmlFor='timeFilter'>
						{t('Time')}
					</FieldLabel>
					<FieldRow>
						<TimeFilterSelect aria-labelledby='timeFilterLabel' id='timeFilter' compactView={true} />
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor='timeFilter'>{t('Logs_from')}</FieldLabel>
					<FieldRow>
						<DateTimeFilter control={control} type='start' />
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor='timeFilter'>{t('Until')}</FieldLabel>
					<FieldRow>
						<DateTimeFilter control={control} type='end' />
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel id='instanceFilterLabel' htmlFor='instanceFilter'>
						{t('Instance')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='instance'
							render={({ field }) => (
								<InstanceFilterSelect appId={appId} aria-labelledby='instanceFilterLabel' id='instanceFilter' {...field} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel id='severityFilterLabel' htmlFor='severityFilter'>
						{t('Severity')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='severity'
							render={({ field }) => <SeverityFilterSelect aria-labelledby='severityFilterLabel' id='severityFilter' {...field} />}
						/>
					</FieldRow>
				</Field>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button variant='secondary' aria-label={t('Clear_filters')} onClick={() => reset()}>
						{t('Clear_filters')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};
