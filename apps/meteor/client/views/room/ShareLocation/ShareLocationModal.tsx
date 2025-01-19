import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { getGeolocationPermission } from './getGeolocationPermission';
import { getGeolocationPosition } from './getGeolocationPosition';
import GenericModal from '../../../components/GenericModal';
import MapView from '../../../components/message/content/location/MapView';

type ShareLocationModalProps = {
	rid: IRoom['_id'];
	tmid: IMessage['tmid'];
	onClose: () => void;
};

const ShareLocationModal = ({ rid, tmid, onClose }: ShareLocationModalProps): ReactElement => {
	const t = useTranslation();
	const dispatchToast = useToastMessageDispatch();
	const { data: permissionState, isLoading: permissionLoading } = useQuery({
		queryKey: ['geolocationPermission'],
		queryFn: getGeolocationPermission,
	});
	const { data: positionData } = useQuery({
		queryKey: ['geolocationPosition', permissionState],

		queryFn: async () => {
			if (permissionLoading || permissionState === 'prompt' || permissionState === 'denied') {
				return;
			}
			return getGeolocationPosition();
		},
	});

	const queryClient = useQueryClient();

	const sendMessage = useEndpoint('POST', '/v1/chat.sendMessage');

	const onConfirm = (): void => {
		if (!positionData) {
			throw new Error('Failed to load position');
		}
		try {
			sendMessage({
				message: {
					rid,
					tmid,
					location: {
						type: 'Point',
						coordinates: [positionData.coords.longitude, positionData.coords.latitude],
					},
				},
			});
		} catch (error) {
			dispatchToast({ type: 'error', message: error });
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
			queryClient.setQueryData(['geolocationPermission'], () => getGeolocationPermission);
		}
	};

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
			<GenericModal title={t('Cannot_share_your_location')} confirmText={t('Ok')} onConfirm={onClose} onClose={onClose}>
				{t('The_necessary_browser_permissions_for_location_sharing_are_not_granted')}
			</GenericModal>
		);
	}

	return (
		<GenericModal title={t('Share_Location_Title')} confirmText={t('Share')} onConfirm={onConfirm} onClose={onClose} onCancel={onClose}>
			<MapView latitude={positionData.coords.latitude} longitude={positionData.coords.longitude} />
		</GenericModal>
	);
};

export default ShareLocationModal;
