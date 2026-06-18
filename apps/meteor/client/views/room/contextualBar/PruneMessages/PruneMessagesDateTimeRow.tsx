import { Box, Margins, Field, FieldLabel, InputBox } from '@rocket.chat/fuselage';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type PruneMessagesDateTimeRowProps = {
	label: string;
	field: 'newer' | 'older';
};

const PruneMessagesDateTimeRow = ({ label, field }: PruneMessagesDateTimeRowProps) => {
	const { register } = useFormContext();
	const { t } = useTranslation();

	return (
		<Field>
			<FieldLabel flexGrow={0}>{label}</FieldLabel>
			<Box display='flex' mi='neg-x4'>
				<Margins inline={4}>
					<InputBox aria-label={`${label} ${t('Date')}`} type='date' flexGrow={1} h='x20' {...register(`${field}.date`)} />
					<InputBox aria-label={`${label} ${t('Time')}`} type='time' flexGrow={1} h='x20' {...register(`${field}.time`)} />
				</Margins>
			</Box>
		</Field>
	);
};
export default PruneMessagesDateTimeRow;
