import { Box } from '@rocket.chat/fuselage';

import type { CallHistoryContact } from '../../definitions';

type CallHistoryTableNumberProps = {
	contact: CallHistoryContact;
};

const CallHistoryTableNumber = ({ contact }: CallHistoryTableNumberProps) => {
	const number = 'number' in contact && contact.number;

	return (
		<Box display='flex' flexDirection='row' alignItems='center' color='secondary'>
			{number && <>{number}</>}
		</Box>
	);
};

export default CallHistoryTableNumber;
