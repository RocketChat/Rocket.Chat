import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

export type DeleteConferenceLinkModalProps = {
	linkTitle: string;
	onConfirm: () => void | Promise<void>;
	onClose: () => void;
	isPending?: boolean;
};

const DeleteConferenceLinkModal = ({ linkTitle, onConfirm, onClose, isPending }: DeleteConferenceLinkModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='danger'
			title={t('Delete_conference_link')}
			confirmText={t('Delete')}
			confirmLoading={isPending}
			onConfirm={onConfirm}
			onCancel={onClose}
			onClose={onClose}
		>
			{t('Delete_conference_link_description', { title: linkTitle })}
		</GenericModal>
	);
};

export default DeleteConferenceLinkModal;
