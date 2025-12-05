import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import DatePicker from './DatePicker';
import FormatSelector from './FormatSelector';
import Preview from './Preview';
import TimePicker from './TimePicker';
import TimezoneSelector from './TimezoneSelector';
import type { ComposerAPI } from '../../../../../../../lib/chats/ChatAPI';
import { dateToISOString, generateTimestampMarkup } from '../../../../../../../lib/utils/timestamp/conversion';
import type { TimezoneKey, TimestampFormat } from '../../../../../../../lib/utils/timestamp/types';

type TimestampForm = {
	date: Date;
	format: TimestampFormat;
	timezone: TimezoneKey;
};

type TimestampPickerProps = {
	onClose: () => void;
	composer?: ComposerAPI;
};

export const TimestampPickerModal = ({ onClose, composer }: TimestampPickerProps) => {
	const { t } = useTranslation();
	const {
		control,
		handleSubmit,
		watch,
		formState: { isValid },
	} = useForm<TimestampForm>({
		defaultValues: {
			date: new Date(),
			format: 'f',
			timezone: 'local',
		},
		mode: 'onChange',
	});

	const currentDate = watch('date');
	const currentFormat = watch('format');
	const currentTimezone = watch('timezone');

	const onSubmit = (data: TimestampForm) => {
		const timestamp = dateToISOString(data.date, data.timezone);
		const markup = generateTimestampMarkup(timestamp, data.format);
		if (composer) {
			composer.insertText(markup);
		}
		onClose();
	};

	return (
		<GenericModal
			variant='warning'
			icon={null}
			title={t('Insert_timestamp')}
			onConfirm={handleSubmit(onSubmit)}
			onCancel={onClose}
			onClose={onClose}
			confirmText={t('Add')}
			confirmDisabled={!isValid}
		>
			<Box display='flex' flexDirection='column'>
				<Controller name='date' control={control} render={({ field }) => <DatePicker {...field} />} />
				<Controller name='date' control={control} render={({ field }) => <TimePicker {...field} />} />
				<Controller name='format' control={control} render={({ field }) => <FormatSelector {...field} />} />
				<Controller name='timezone' control={control} render={({ field }) => <TimezoneSelector {...field} />} />
				<Preview date={currentDate} format={currentFormat} timezone={currentTimezone} />
			</Box>
		</GenericModal>
	);
};
