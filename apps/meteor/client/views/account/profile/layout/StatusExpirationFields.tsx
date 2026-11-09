import { Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type StatusExpirationFieldsProps = {
	duration: ReactNode;
	/** The date and time inputs a custom duration adds, shown beside each other under the duration. */
	custom?: ReactNode;
};

/**
 * How long a status lasts: the duration choice, and for a custom one the date and time it ends.
 */
const StatusExpirationFields = ({ duration, custom }: StatusExpirationFieldsProps) => (
	<Stack gap='x8'>
		{duration}
		{custom && (
			<Stack direction='row' gap='x8'>
				{custom}
			</Stack>
		)}
	</Stack>
);

export default StatusExpirationFields;
