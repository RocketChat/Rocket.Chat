import { Field, InputBox, Box, Margins } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

type PruneMessagesDateTimeRowProps = {
	label: string;
	dateTime: {
		date: string;
		time: string;
	};
	handleDateTime: {
		date: (eventOrValue: unknown) => void;
		time: (eventOrValue: unknown) => void;
	};
};

const PruneMessagesDateTimeRow = ({ label, dateTime, handleDateTime }: PruneMessagesDateTimeRowProps): ReactElement => (
	<Field>
		<Field.Label flexGrow={0}>{label}</Field.Label>
		<Box display='flex' mi='neg-x4'>
			<Margins inline='x4'>
				<InputBox type='date' value={dateTime?.date} onChange={handleDateTime?.date} flexGrow={1} h='x20' />
				<InputBox type='time' value={dateTime?.time} onChange={handleDateTime?.time} flexGrow={1} h='x20' />
			</Margins>
		</Box>
	</Field>
);

export default PruneMessagesDateTimeRow;
