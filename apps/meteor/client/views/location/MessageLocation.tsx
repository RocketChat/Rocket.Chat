import type { IMessage } from '@rocket.chat/core-typings';
import type { FC } from 'react';
import React from 'react';

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
