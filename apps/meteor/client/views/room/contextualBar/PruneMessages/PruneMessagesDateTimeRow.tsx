import { Field, InputBox, Box, Margins } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

type PruneMessagesDateTimeRowProps = {
	label: string;
	registerDate: UseFormRegisterReturn;
	registerTime: UseFormRegisterReturn;
};

const PruneMessagesDateTimeRow = ({ label, registerDate, registerTime }: PruneMessagesDateTimeRowProps): ReactElement => {

	return (
		<Field>
			<Field.Label flexGrow={0}>{label}</Field.Label>
			<Box display='flex' mi='neg-x4'>
				<Margins inline='x4'>
					<InputBox type='date' flexGrow={1} h='x20' {...registerDate}/>
					<InputBox type='time' flexGrow={1} h='x20' {...registerTime}/>
				</Margins>
			</Box>
		</Field>
	);
};

export default PruneMessagesDateTimeRow;
