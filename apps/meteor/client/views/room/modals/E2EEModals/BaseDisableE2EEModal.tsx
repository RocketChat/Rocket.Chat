import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { useState } from 'react';

import DisableE2EEModal from './DisableE2EEModal';
import ResetKeysE2EEModal from './ResetKeysE2EEModal';

const STEPS = {
	DISABLE_E2EE: 'DISABLE_E2EE',
	RESET_ROOM_KEY: 'RESET_ROOM_KEY',
};

type BaseDisableE2EEModalProps = {
	onConfirm: () => void;
	onClose: () => void;
	roomType: string;
	roomId: string;
	canResetRoomKey: boolean;
};

const BaseDisableE2EEModal = ({
	onConfirm,
	onClose,
	roomType,
	roomId,
	canResetRoomKey,
}: BaseDisableE2EEModalProps): ReactElement | null => {
	const [step, setStep] = useState(STEPS.DISABLE_E2EE);

	const onResetRoomKey = useEffectEvent(() => {
		setStep(STEPS.RESET_ROOM_KEY);
	});

	if (step === STEPS.RESET_ROOM_KEY && canResetRoomKey) {
		return <ResetKeysE2EEModal roomType={roomType} roomId={roomId} onCancel={onClose} />;
	}

	return (
		<DisableE2EEModal
			onConfirm={onConfirm}
			onCancel={onClose}
			roomType={roomType}
			canResetRoomKey={canResetRoomKey}
			onResetRoomKey={onResetRoomKey}
		/>
	);
};

export default BaseDisableE2EEModal;
