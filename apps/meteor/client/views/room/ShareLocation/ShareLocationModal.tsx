// ShareLocationModal.tsx — Static only; Live option kept (no-op)
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import MapLibreMap from './MapLibreMap';
import { getGeolocationPermission } from './getGeolocationPermission';
import { getGeolocationPosition } from './getGeolocationPosition';
import { createMapProvider, type IMapProvider } from './mapProvider';

interface IGeolocationError {
	code?: number;
	message?: string;
}

type ShareLocationModalProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['tmid'];
	onClose: () => void;
};

type Stage = 'choose' | 'static';

const ShareLocationModal = ({ rid, tmid, onClose }: ShareLocationModalProps): ReactElement => {
	const t = useTranslation();
	const dispatchToast = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const sendMessage = useEndpoint('POST', '/v1/chat.sendMessage');

	const [stage, setStage] = useState<Stage>('choose');
	const [choice, setChoice] = useState<'current' | 'live' | null>(null);

	const map: IMapProvider = useMemo(() => createMapProvider('openstreetmap', {}), []);

	const { data: permissionState, isLoading: permissionLoading } = useQuery({
		queryKey: ['geolocationPermission'],
		queryFn: getGeolocationPermission,
		refetchOnWindowFocus: false,
	});

	const {
		data: positionData,
		isLoading: positionLoading,
		isFetching: positionFetching,
		isError: positionError,
		error: positionErr,
	} = useQuery({
		queryKey: ['geolocationPosition'],
		queryFn: () => getGeolocationPosition(),
		enabled: stage === 'static' && permissionState === 'granted',
		refetchOnWindowFocus: false,
		retry: (failureCount, error) => {
			const e = error as IGeolocationError;
			const code = e?.code;
			const msg = String(e?.message || '').toLowerCase();
			const transient = code !== 1 && (code === 2 || msg.includes('kclerrorlocationunknown') || msg.includes('location unknown'));
			return transient && failureCount < 1;
		},
		retryDelay: 1500,
	});

	const onConfirmRequestLocation = async (): Promise<void> => {
		try {
			const pos = await getGeolocationPosition();
			queryClient.setQueryData(['geolocationPermission'], 'granted');
			queryClient.setQueryData(['geolocationPosition'], pos);
		} catch {
			const state = await getGeolocationPermission();
			queryClient.setQueryData(['geolocationPermission'], state);
		}
	};

	// --- Stage 2: Choose static vs live ---
	if (stage === 'choose' && !choice) {
		return (
			<GenericModal
				title={t('Share_Location_Title')}
				onClose={onClose}
				cancelText={t('Live_Location')}
				onCancel={() => {
					setChoice('live');
				}}
				confirmText={t('Current_Location')}
				onConfirm={() => {
					setChoice('current');
					setStage('static');
				}}
			>
				{t('Share_Location_Choice_Description')}
			</GenericModal>
		);
	}

	// Live path (disabled placeholder)
	if (choice === 'live') {
		return (
			<GenericModal
				title={t('Live_Location')}
				onClose={() => {
					setChoice(null);
					setStage('choose');
				}}
				confirmText={t('Ok')}
				onConfirm={() => {
					setChoice(null);
					setStage('choose');
				}}
			>
				{t('Live_Location_Disabled_Body')}
			</GenericModal>
		);
	}

	// --- Stage 3: Static flow (with permission gating) ---
	if (stage === 'static') {
		if (permissionLoading || permissionState === 'prompt' || permissionState === undefined) {
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

		// Explicitly denied
		if (permissionState === 'denied') {
			return (
				<GenericModal title={t('Cannot_share_your_location')} confirmText={t('Ok')} onConfirm={onClose} onClose={onClose}>
					{t('The_necessary_browser_permissions_for_location_sharing_are_not_granted')}
				</GenericModal>
			);
		}

		// Granted, still fetching coordinates → loader
		if (permissionState === 'granted' && (positionLoading || positionFetching)) {
			return (
				<GenericModal title={t('Share_Location_Title')} confirmText={t('Cancel')} onConfirm={onClose} onClose={onClose}>
					{t('Getting_Your_Location')}
				</GenericModal>
			);
		}

		// Granted but failed
		if (permissionState === 'granted' && positionError) {
			return (
				<GenericModal
					title={t('Cannot_share_your_location')}
					confirmText={t('Try_again')}
					onConfirm={() => {
						queryClient.resetQueries({ queryKey: ['geolocationPosition'] });
					}}
					onClose={onClose}
					cancelText={t('Cancel')}
					onCancel={onClose}
				>
					<div style={{ marginBottom: 16 }}>{(positionErr as Error | undefined)?.message || t('Unable_To_Fetch_Current_Location')}</div>

					<div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>
						<strong>{t('Tips_Improve_Location_Accuracy_Title')}</strong>
						<br />• {t('Tips_Improve_Location_Accuracy_Bullet_1')}
						<br />• {t('Tips_Improve_Location_Accuracy_Bullet_2')}
						<br />• {t('Tips_Improve_Location_Accuracy_Bullet_3')}
						<br />• {t('Tips_Improve_Location_Accuracy_Bullet_4')}
					</div>
				</GenericModal>
			);
		}

		const onConfirmStatic = async (): Promise<void> => {
			if (!positionData) return;
			const { latitude, longitude } = positionData.coords;

			try {
				const mapsLink = map.getMapsLink(latitude, longitude);

				const locationMessage = `📍 **${t('Shared_Location')}**
🔗 **[${t('View_on_OpenStreetMap')}](${mapsLink})**
📌 \`${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°\``;

				await sendMessage({
					message: {
						rid,
						tmid,
						msg: locationMessage,
					},
				});
			} catch (error) {
				dispatchToast({ type: 'error', message: error instanceof Error ? error.message : String(error) });
			} finally {
				onClose();
			}
		};

		// Static share preview + confirm
		return (
			<GenericModal
				title={t('Share_Location_Title')}
				confirmText={t('Share')}
				onConfirm={onConfirmStatic}
				onClose={onClose}
				onCancel={onClose}
			>
				<div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{t('Using_OpenStreetMap_Label')}</div>

				{positionData && (
					<>
						<MapLibreMap lat={positionData.coords.latitude} lon={positionData.coords.longitude} zoom={17} height={360} />
					</>
				)}
			</GenericModal>
		);
	}

	return <></>;
};

export default ShareLocationModal;
