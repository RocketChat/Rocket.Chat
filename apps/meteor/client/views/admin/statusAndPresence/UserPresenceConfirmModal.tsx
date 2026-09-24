import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { GenericModalProps } from '@rocket.chat/ui-client';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useState } from 'react';

export type UserPresenceConfirmModalProps = {
	title: string;
	description: ReactNode;
	confirmText: string;
	icon?: GenericModalProps['icon'];
	onConfirm: () => Promise<boolean>;
	onClose: () => void;
};

const UserPresenceConfirmModal = ({ title, description, confirmText, icon, onConfirm, onClose }: UserPresenceConfirmModalProps) => {
	const [confirming, setConfirming] = useState(false);

	const handleConfirm = useStableCallback(async () => {
		setConfirming(true);

		if (await onConfirm()) {
			onClose();
			return;
		}

		setConfirming(false);
	});

	return (
		<GenericModal
			icon={icon}
			title={title}
			confirmText={confirmText}
			confirmLoading={confirming}
			onConfirm={handleConfirm}
			onCancel={onClose}
			onClose={onClose}
		>
			{description}
		</GenericModal>
	);
};

export default UserPresenceConfirmModal;
