import { Box, Field, FieldLabel, InputBox } from '@rocket.chat/fuselage';
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
			<Box display='flex' gap={8}>
				<InputBox aria-label={`${label} ${t('Date')}`} type='date' height='x20' {...register(`${field}.date`)} />
				<InputBox aria-label={`${label} ${t('Time')}`} type='time' height='x20' {...register(`${field}.time`)} />
			</Box>
		</Field>
	);
};
export default PruneMessagesDateTimeRow;
