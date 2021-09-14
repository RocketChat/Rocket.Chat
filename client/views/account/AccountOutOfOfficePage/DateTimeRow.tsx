import { Field, InputBox, Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';

interface IDateTimeRowProps {
	label: string;
	dateTime: {
		date: string;
		time: string;
	};
	handleDateTime: {
		date: (e: unknown) => void;
		time: (e: unknown) => void;
	};
}

const DateTimeRow = ({ label, dateTime, handleDateTime }: IDateTimeRowProps): JSX.Element => (
	<Field>
		<Field.Label flexGrow={0}>{label}</Field.Label>
		<Box display='flex' mi='neg-x4'>
			<Margins inline='x4'>
				<InputBox
					type='date'
					value={dateTime.date}
					onChange={handleDateTime.date}
					flexGrow={1}
					h='x20'
				/>
				<InputBox
					type='time'
					value={dateTime.time}
					onChange={handleDateTime.time}
					flexGrow={1}
					h='x20'
				/>
			</Margins>
		</Box>
	</Field>
);

export default DateTimeRow;
