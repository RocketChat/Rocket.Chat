import { Box, Margins, Field, FieldLabel, InputBox } from '@rocket.chat/fuselage';
import { useId, type ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';

type PruneMessagesDateTimeRowProps = {
	label: string;
	field: 'newer' | 'older';
};

const PruneMessagesDateTimeRow = ({ label, field }: PruneMessagesDateTimeRowProps): ReactElement => {
	const { register } = useFormContext();
	const fieldId = useId();

	return (
		<Field>
			<FieldLabel id={fieldId} flexGrow={0}>
				{label}
			</FieldLabel>
			<Box display='flex' mi='neg-x4'>
				<Margins inline={4}>
					<InputBox aria-labelledby={fieldId} type='date' flexGrow={1} h='x20' {...register(`${field}.date`)} />
					<InputBox aria-labelledby={fieldId} type='time' flexGrow={1} h='x20' {...register(`${field}.time`)} />
				</Margins>
			</Box>
		</Field>
	);
};
export default PruneMessagesDateTimeRow;
