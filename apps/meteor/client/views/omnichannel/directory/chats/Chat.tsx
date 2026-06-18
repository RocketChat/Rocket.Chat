import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';

import RoomOpener from '../../../room/RoomOpener';

type ChatProps = { rid: IRoom['_id'] };

const Chat = ({ rid }: ChatProps) => {
	return (
		<Box position='absolute' backgroundColor='surface' width='full' height='full'>
			<RoomOpener type='l' reference={rid} />
		</Box>
	);
};
export default Chat;
