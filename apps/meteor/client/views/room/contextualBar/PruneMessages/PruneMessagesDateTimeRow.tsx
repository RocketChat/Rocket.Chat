import { Field, FieldLabel, InputBox, Stack } from '@rocket.chat/fuselage';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type PruneMessagesDateTimeRowProps = {
	label: string;
	field: 'newer' | 'older';
};

const PruneMessagesDateTimeRow = ({ label, field }: PruneMessagesDateTimeRowProps) => {
	const { register } = useFormContext();
	const { t } = useTranslation();

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<Stack direction='row' gap={8}>
				<InputBox aria-label={`${label} ${t('Date')}`} type='date' {...register(`${field}.date`)} />
				<InputBox aria-label={`${label} ${t('Time')}`} type='time' {...register(`${field}.time`)} />
			</Stack>
		</Field>
	);
};
export default PruneMessagesDateTimeRow;
