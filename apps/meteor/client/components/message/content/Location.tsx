import type { IMessage } from '@rocket.chat/core-typings';

import MapView from './location/MapView';

type LocationProps = {
	location?: IMessage['location'];
};

const Location = ({ location }: LocationProps) => {
	const [longitude, latitude] = location?.coordinates ?? [];

	if (!latitude || !longitude) {
		return null;
	}

	return <MapView latitude={latitude} longitude={longitude} />;
};

export default Location;
