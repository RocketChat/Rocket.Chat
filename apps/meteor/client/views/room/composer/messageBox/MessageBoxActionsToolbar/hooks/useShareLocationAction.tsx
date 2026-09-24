import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useComposerCapabilities } from '../../../ComposerCapabilitiesContext';
import { useComposerMenuActions } from '../../../ComposerMenuActionsContext';

export const useShareLocationAction = (disabled: boolean, room?: IRoom, tmid?: IMessage['tmid']): GenericMenuItemProps => {
	if (!room) {
		throw new Error('Invalid room');
	}

	const { t } = useTranslation();
	const { shareLocation } = useComposerMenuActions();

	const { mapViewEnabled: isMapViewEnabled, googleMapsApiKey } = useComposerCapabilities();
	const isGeolocationCurrentPositionSupported = Boolean(navigator.geolocation?.getCurrentPosition);
	const canGetGeolocation = isMapViewEnabled && isGeolocationCurrentPositionSupported && googleMapsApiKey && googleMapsApiKey.length;

	const handleShareLocation = () => shareLocation(room, tmid);

	const allowGeolocation = room && canGetGeolocation && !isRoomFederated(room);

	return {
		id: 'share-location',
		content: t('Location'),
		icon: 'map-pin',
		onClick: handleShareLocation,
		disabled: !allowGeolocation || disabled,
	};
};
