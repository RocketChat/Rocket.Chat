import React, { FC } from 'react';

import type { IMessage } from '@rocket.chat/core-typings';
import MapView from './MapView';

type MessageLocationProps = {
	location?: IMessage['location'];
};

const MessageLocation: FC<MessageLocationProps> = ({ location }) => {
	const [longitude, latitude] = location?.coordinates ?? [];

	if (!latitude || !longitude) {
		return null;
	}

	return <MapView latitude={latitude} longitude={longitude} />;
};

export default MessageLocation;
