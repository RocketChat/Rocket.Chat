import React, { FC } from 'react';

import { IMessage } from '../../../definition/IMessage';
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
