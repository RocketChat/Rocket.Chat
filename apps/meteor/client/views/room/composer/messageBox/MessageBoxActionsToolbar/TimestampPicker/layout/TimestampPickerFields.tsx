import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type TimestampPickerFieldsProps = {
	children: ReactNode;
};

/**
 * The timestamp picker's preview and fields, one under the other.
 */
const TimestampPickerFields = ({ children }: TimestampPickerFieldsProps) => (
	<Box display='flex' flexDirection='column' paddingBlock='x16' gap='x32'>
		{children}
	</Box>
);

export default TimestampPickerFields;
