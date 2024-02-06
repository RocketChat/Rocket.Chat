import { Field, FieldLabel, InputBox, Box, Margins } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';

type PruneMessagesDateTimeRowProps = {
	label: string;
	field: 'newer' | 'older';
};

const PruneMessagesDateTimeRow = ({ label, field }: PruneMessagesDateTimeRowProps): ReactElement => {
	const { control } = useFormContext();

	return (
		<Field>
			<FieldLabel flexGrow={0}>{label}</FieldLabel>
			<Box display='flex' mi='neg-x4'>
				<Margins inline={4}>
					<Controller
						name={`${field}.date`}
						control={control}
						render={({ field }) => <InputBox type='date' flexGrow={1} h='x20' {...field} />}
					/>
					<Controller
						name={`${field}.time`}
						control={control}
						render={({ field }) => <InputBox type='time' flexGrow={1} h='x20' {...field} />}
					/>
				</Margins>
			</Box>
		</Field>
	);
};
export default PruneMessagesDateTimeRow;
