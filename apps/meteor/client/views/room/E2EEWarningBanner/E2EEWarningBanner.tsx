import { isRoomFederated } from '@rocket.chat/core-typings';
import { Banner, Box, Button } from '@rocket.chat/fuselage';
import { useLocalStorage, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { imperativeModal } from '@rocket.chat/ui-client';
import { useSetting, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { getRoomTypeTranslation } from '../../../lib/getRoomTypeTranslation';
import { useRoom, useRoomSubscription } from '../contexts/RoomContext';
import { useE2EEState } from '../hooks/useE2EEState';
import EnableE2EEModal from '../modals/E2EEModals/EnableE2EEModal';

const E2EEWarningBanner = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const subscription = useRoomSubscription();
	const e2eEnabled = useSetting('E2E_Enable', false);
	const e2eeState = useE2EEState();
	const dispatchToastMessage = useToastMessageDispatch();
	const toggleE2E = useEndpoint('POST', '/v1/rooms.saveRoomSettings');

	const [dismissed, setDismissed] = useLocalStorage(`e2eeWarningBannerDismissed-${room._id}`, false);

	const isE2EEReady = e2eeState === 'READY' || e2eeState === 'SAVE_PASSWORD';
	const shouldShow = e2eEnabled && isE2EEReady && room.t === 'd' && !room.encrypted && !isRoomFederated(room) && !dismissed;

	const handleEnableE2EE = useStableCallback(() => {
		imperativeModal.open({
			component: EnableE2EEModal,
			props: {
				onClose: imperativeModal.close,
				roomType: getRoomTypeTranslation(room)?.toLowerCase(),
				onConfirm: async () => {
					try {
						const { success } = await toggleE2E({ rid: room._id, encrypted: true });
						if (!success) {
							return;
						}

						imperativeModal.close();
						dispatchToastMessage({ type: 'success', message: t('E2E_Encryption_enabled_for_room', { roomName: room.name }) });

						if (subscription?.autoTranslate) {
							dispatchToastMessage({ type: 'success', message: t('AutoTranslate_Disabled_for_room', { roomName: room.name }) });
						}
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: error });
					}
				},
			},
		});
	});

	if (!shouldShow) {
		return null;
	}

	return (
		<Banner variant='warning' closeable onClose={() => setDismissed(true)}>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexWrap='wrap'>
				<Box marginInlineEnd={16}>{t('E2EE_not_enabled_for_this_dm_warning')}</Box>
				<Button small onClick={handleEnableE2EE}>
					{t('Enable_E2E_encryption')}
				</Button>
			</Box>
		</Banner>
	);
};

export default E2EEWarningBanner;
