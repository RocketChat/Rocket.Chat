import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { Accounts } from 'meteor/accounts-base';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import RoomE2EENotAllowed from './RoomE2EENotAllowed';
import { e2e } from '../../../../app/e2e/client';
import { E2EEState } from '../../../../app/e2e/client/E2EEState';
import { E2ERoomState } from '../../../../app/e2e/client/E2ERoomState';
import RoomBody from '../body/RoomBody';
import RoomBodyV2 from '../body/RoomBodyV2';
import { useRoom } from '../contexts/RoomContext';
import { useE2EERoomState } from '../hooks/useE2EERoomState';
import { useE2EEState } from '../hooks/useE2EEState';

const RoomE2EESetup = () => {
	const room = useRoom();

	const e2eeState = useE2EEState();
	const e2eRoomState = useE2EERoomState(room._id);

	const { t } = useTranslation();
	const randomPassword = Accounts.storageLocation.getItem('e2e.randomPassword');

	const onSavePassword = useCallback(() => {
		if (!randomPassword) {
			return;
		}

		e2e.openSaveE2EEPasswordModal(randomPassword);
	}, [randomPassword]);

	const onEnterE2EEPassword = useCallback(() => e2e.decodePrivateKeyFlow(), []);

	if (e2eeState === E2EEState.SAVE_PASSWORD) {
		return (
			<RoomE2EENotAllowed
				title={t('__roomName__is_encrypted', { roomName: room.name })}
				subTitle={t('Save_your_encryption_password_to_access')}
				icon='key'
				action={onSavePassword}
				btnText={t('Save_E2EE_password')}
			/>
		);
	}

	if (e2eeState === E2EEState.ENTER_PASSWORD) {
		return (
			<RoomE2EENotAllowed
				title={t('__roomName__is_encrypted', { roomName: room.name })}
				subTitle={t('Enter_your_E2E_password_to_access')}
				icon='key'
				action={onEnterE2EEPassword}
				btnText={t('Enter_your_E2E_password')}
			/>
		);
	}

	if (e2eRoomState === E2ERoomState.WAITING_KEYS) {
		return (
			<RoomE2EENotAllowed
				title={t('Check_back_later')}
				subTitle={t('__roomName__encryption_keys_need_to_be_updated', { roomName: room.name })}
				icon='clock'
			/>
		);
	}

	return (
		<FeaturePreview feature='newNavigation'>
			<FeaturePreviewOn>
				<RoomBodyV2 />
			</FeaturePreviewOn>
			<FeaturePreviewOff>
				<RoomBody />
			</FeaturePreviewOff>
		</FeaturePreview>
	);
};

export default RoomE2EESetup;
