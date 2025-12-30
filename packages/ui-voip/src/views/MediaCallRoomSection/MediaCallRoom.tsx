import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useState } from 'react';

import MediaCallRoomSection from './MediaCallRoomSection';

const MediaCallRoom = ({ body }: { body: ReactNode }) => {
	const [showChat, setShowChat] = useState(true);

	const onClickToggleChat = () => {
		setShowChat((prev) => !prev);
	};
	return (
		<Box
			w='full'
			h='full'
			// bg='hover'
			// flexShrink={0}
			// borderBlockEnd='1px solid'
			// borderBlockEndColor='stroke-light'
			display='flex'
			flexDirection='column'
			justifyContent='space-between'
		>
			<MediaCallRoomSection showChat={showChat} onToggleChat={onClickToggleChat} />

			{showChat && (
				<Box w='full' flexGrow={1}>
					{body}
				</Box>
			)}
		</Box>
	);
};

export default MediaCallRoom;
