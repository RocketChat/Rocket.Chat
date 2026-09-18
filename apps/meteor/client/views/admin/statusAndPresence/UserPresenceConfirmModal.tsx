import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useState } from 'react';

export type UserPresenceConfirmModalProps = {
	title: string;
	description: string;
	confirmText: string;
	variant?: 'danger';
	onConfirm: () => Promise<boolean>;
	onClose: () => void;
};

const UserPresenceConfirmModal = ({ title, description, confirmText, variant, onConfirm, onClose }: UserPresenceConfirmModalProps) => {
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
			variant={variant}
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
