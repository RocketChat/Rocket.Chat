import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import {
	useEndpoint,
	useTranslation,
	useToastMessageDispatch,
	useSetting,
} from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { getGeolocationPermission } from './getGeolocationPermission';
import { getGeolocationPosition } from './getGeolocationPosition';
import MapView from '../../../components/message/content/location/MapView';
import { useState } from 'react';
import LiveLocationModal from './LiveLocationModal';


type ShareLocationModalProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['tmid'];
	onClose: () => void;
};

const ShareLocationModal = ({ rid, tmid, onClose }: ShareLocationModalProps): ReactElement => {
	const t = useTranslation();
	const dispatchToast = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const sendMessage = useEndpoint('POST', '/v1/chat.sendMessage');
	//const googleMapsApiKey = 'AIzaSyBeNJSMCi8kD4c6SOvZ4vxHnWYp2yzDbmg';
	const [choice, setChoice] = useState<'current' | 'live' | null>(null);
	// const googleMapsApiKey = useSetting('MapView_GMapsAPIKey') as string;

	const { data: permissionState, isLoading: permissionLoading } = useQuery({
		queryKey: ['geolocationPermission'],
		queryFn: getGeolocationPermission,
	});

	const { data: positionData } = useQuery({
		queryKey: ['geolocationPosition', permissionState],
		queryFn: async () => {
			if (permissionLoading || permissionState !== 'granted') {
				return;
			}
			return getGeolocationPosition();
		},
		enabled: permissionState === 'granted',
	});

	const onConfirm = (): void => {
		if (!positionData) {
			dispatchToast({ type: 'error', message: 'Location not available.' });
			return;
		}

		const { latitude, longitude } = positionData.coords;

		const mapsLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

		const locationIQKey = 'pk.898e468814facdcffda869b42260a2f0';
		const staticMapUrl = `https://maps.locationiq.com/v2/staticmap?key=${locationIQKey}&center=${latitude},${longitude}&zoom=17&size=512x512&markers=icon:small-red-cutout|${latitude},${longitude}`;

		try {
			sendMessage({
				message: {
					rid,
					tmid,
					attachments: [
						{
							ts: new Date(),
							title: '📍 Shared Location', // Add this
							title_link: mapsLink, // link to OSM
							title_link_download: false,
							image_url: staticMapUrl, // Map image
							// REMOVE thumb_url to avoid the broken "Retry"
							description: `Latitude: ${latitude.toFixed(5)}, Longitude: ${longitude.toFixed(5)}`,
						},
					],
				},
			});
		} catch (error) {
			dispatchToast({ type: 'error', message: error instanceof Error ? error.message : String(error) });
		} finally {
			onClose();
		}
	};

	const onConfirmRequestLocation = async (): Promise<void> => {
		try {
			const position = await getGeolocationPosition();
			queryClient.setQueryData(['geolocationPosition', 'granted'], position);
			queryClient.setQueryData(['geolocationPermission'], 'granted');
		} catch (e) {
			queryClient.setQueryData(['geolocationPermission'], () => getGeolocationPermission());
		}
	};

	if (!choice) {
		return (
			<GenericModal
				title={t('Share_Location_Title')}
				onClose={onClose}
				onCancel={() => {
					setChoice('live');
				}}
				cancelText="Live Location"
				confirmText="Current Location"
				onConfirm={() => setChoice('current')}
			>
				Would you like to share your current location or start live location sharing?
			</GenericModal>
		);
	}

	if (choice === 'live') {
		return (
			<LiveLocationModal
				rid={rid}
				tmid={tmid}
				onClose={onClose}
			/>
		);
	}


	if (permissionLoading || permissionState === 'prompt') {
		return (
			<GenericModal
				title={t('You_will_be_asked_for_permissions')}
				confirmText={t('Continue')}
				onConfirm={onConfirmRequestLocation}
				onClose={onClose}
				onCancel={onClose}
			/>
		);
	}

	if (permissionState === 'denied' || !positionData) {
		return (
			<GenericModal
				title={t('Cannot_share_your_location')}
				confirmText={t('Ok')}
				onConfirm={onClose}
				onClose={onClose}
			>
				{t('The_necessary_browser_permissions_for_location_sharing_are_not_granted')}
			</GenericModal>
		);
	}

	return (
		<GenericModal
			title={t('Share_Location_Title')}
			confirmText={t('Share')}
			onConfirm={onConfirm}
			onClose={onClose}
			onCancel={onClose}
		>
			<MapView
				latitude={positionData.coords.latitude}
				longitude={positionData.coords.longitude}
			/>
		</GenericModal>
	);
};

export default ShareLocationModal;
