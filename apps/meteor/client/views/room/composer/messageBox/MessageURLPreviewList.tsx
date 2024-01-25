import React, { memo } from 'react';
import type { ReactElement } from 'react';

import { useRoom } from '../../contexts/RoomContext';
import MessageURLPreview from './MessageURLPreview';

type MessageURLPreviewListProps = {
	urls: string[];
};

const MessageURLPreviewList = ({ urls }: MessageURLPreviewListProps): ReactElement => {
	const room = useRoom();

	return (
		<>
			{urls.map((url, index) => {
				return <MessageURLPreview key={index} url={url} roomId={room._id} />;
			})}
		</>
	);
};

export default memo(MessageURLPreviewList);
