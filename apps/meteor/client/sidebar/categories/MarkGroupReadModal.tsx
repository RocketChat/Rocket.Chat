import { GenericModalDoNotAskAgain } from '@rocket.chat/ui-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type MarkGroupReadModalProps = {
	/** The group as its header names it. */
	groupTitle: string;
	/** How many rooms become read. */
	count: number;
	/** Marks the rooms read; the modal stays up, its button busy, until this settles. */
	onConfirm: () => Promise<void>;
	onClose: () => void;
};

/**
 * Asks before a group's unread rooms are marked read, then keeps the modal up with a busy confirm button while
 * the rooms are read one batch at a time, so a long group never looks like nothing happened.
 */
const MarkGroupReadModal = ({ groupTitle, count, onConfirm, onClose }: MarkGroupReadModalProps) => {
	const { t } = useTranslation();
	const [running, setRunning] = useState(false);

	const handleConfirm = async () => {
		setRunning(true);
		try {
			await onConfirm();
		} finally {
			onClose();
		}
	};

	return (
		<GenericModalDoNotAskAgain
			icon={null}
			title={t('Mark_rooms_as_read')}
			confirmText={t('Mark_read')}
			cancelText={t('Cancel')}
			confirmLoading={running}
			confirmDisabled={running}
			onClose={onClose}
			onCancel={onClose}
			onConfirm={handleConfirm}
			dontAskAgain={{
				action: 'markGroupRead',
				label: t('Mark_rooms_as_read'),
			}}
		>
			{t('Unread_rooms_in_group_become_read', { count, group: groupTitle })}
		</GenericModalDoNotAskAgain>
	);
};

export default MarkGroupReadModal;
