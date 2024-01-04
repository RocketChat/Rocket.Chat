import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useSetting, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';

import ShareLocationModal from '../../../../ShareLocation/ShareLocationModal';

export const useShareLocationAction = (room?: IRoom, tmid?: string) => {
	const setModal = useSetModal();

	if (!room) {
		throw new Error('useShareLocationAction must be used within a Room');
	}

	const isMapViewEnabled = useSetting('MapView_Enabled') === true;
	const isGeolocationCurrentPositionSupported = Boolean(navigator.geolocation?.getCurrentPosition);
	const googleMapsApiKey = useSetting('MapView_GMapsAPIKey') as string;
	const canGetGeolocation = isMapViewEnabled && isGeolocationCurrentPositionSupported && googleMapsApiKey && googleMapsApiKey.length;

	const allowGeolocation = room && canGetGeolocation && !isRoomFederated(room);

	const handleShareLocation = () => setModal(<ShareLocationModal rid={room._id} tmid={tmid} onClose={() => setModal(null)} />);

	return { handleShareLocation, allowGeolocation };
};
