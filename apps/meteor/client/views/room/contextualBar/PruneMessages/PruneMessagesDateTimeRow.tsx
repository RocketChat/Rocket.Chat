import { Field, FieldLabel, InputBox, Box, Margins } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';

type PruneMessagesDateTimeRowProps = {
	label: string;
	field: 'newer' | 'older';
};

const PruneMessagesDateTimeRow = ({ label, field }: PruneMessagesDateTimeRowProps): ReactElement => {
	const { register } = useFormContext();

	return (
		<Field>
			<FieldLabel flexGrow={0}>{label}</FieldLabel>
			<Box display='flex' mi='neg-x4'>
				<Margins inline={4}>
					<InputBox type='date' flexGrow={1} h='x20' {...register(`${field}.date`)} />
					<InputBox type='time' flexGrow={1} h='x20' {...register(`${field}.time`)} />
				</Margins>
			</Box>
		</Field>
	);
};
export default PruneMessagesDateTimeRow;
