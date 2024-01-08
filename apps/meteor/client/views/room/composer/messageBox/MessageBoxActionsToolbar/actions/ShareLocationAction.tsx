import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Option, OptionTitle, OptionIcon, OptionContent } from '@rocket.chat/fuselage';
import { useSetting, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import ShareLocationModal from '../../../../ShareLocation/ShareLocationModal';

const ShareLocationAction = ({ room, tmid }: { room: IRoom; tmid?: string }) => {
	const t = useTranslation();
	const setModal = useSetModal();

	const isMapViewEnabled = useSetting('MapView_Enabled') === true;
	const isGeolocationCurrentPositionSupported = Boolean(navigator.geolocation?.getCurrentPosition);
	const googleMapsApiKey = useSetting('MapView_GMapsAPIKey') as string;
	const canGetGeolocation = isMapViewEnabled && isGeolocationCurrentPositionSupported && googleMapsApiKey && googleMapsApiKey.length;

	const handleShareLocation = () => setModal(<ShareLocationModal rid={room._id} tmid={tmid} onClose={() => setModal(null)} />);

	const allowGeolocation = room && canGetGeolocation && !isRoomFederated(room);

	return (
		<>
			<OptionTitle>{t('Share')}</OptionTitle>
			<Option {...(!allowGeolocation && { title: t('Not_Available') })} disabled={!allowGeolocation} onClick={handleShareLocation}>
				<OptionIcon name='map-pin' />
				<OptionContent>{t('Location')}</OptionContent>
			</Option>
		</>
	);
};

export default ShareLocationAction;
