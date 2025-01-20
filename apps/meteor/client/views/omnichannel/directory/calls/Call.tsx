import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import RoomOpener from '../../../room/RoomOpener';

type CallProps = { rid: IRoom['_id'] };

const Call = ({ rid }: CallProps): ReactElement => {
	return (
		<Box position='absolute' backgroundColor='surface' width='full' height='full'>
			<RoomOpener type='v' reference={rid} />
		</Box>
	);
};
export default Call;
