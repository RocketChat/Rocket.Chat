import { Button, ButtonGroup, Label } from '@rocket.chat/fuselage';
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
import FilterField from './layout/FilterField';

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
				<FilterField inset>
					<Label id='timeFilterLabel' htmlFor='timeFilter'>
						{t('Time')}
					</Label>
					<TimeFilterSelect aria-labelledby='timeFilterLabel' id='timeFilter' compactView={true} />
				</FilterField>
				<FilterField inset>
					<Label htmlFor='timeFilter'>{t('Logs_from')}</Label>
					<DateTimeFilter control={control} type='start' />
				</FilterField>
				<FilterField inset>
					<Label htmlFor='timeFilter'>{t('Until')}</Label>
					<DateTimeFilter control={control} type='end' />
				</FilterField>
				<FilterField inset>
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
				</FilterField>
				<FilterField inset>
					<Label id='severityFilterLabel' htmlFor='severityFilter'>
						{t('Severity')}
					</Label>
					<Controller
						control={control}
						name='severity'
						render={({ field }) => <SeverityFilterSelect aria-labelledby='severityFilterLabel' id='severityFilter' {...field} />}
					/>
				</FilterField>
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
