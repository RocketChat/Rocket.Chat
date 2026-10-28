import type { IUpload } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export const useDeleteFile = (reload: () => void) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const deleteMessage = useEndpoint('POST', '/v1/chat.delete');

	const handleDelete = useStableCallback((_id: IUpload['_id']) => {
		const onConfirm = async () => {
			try {
				await deleteMessage({ fileId: _id });
				dispatchToastMessage({ type: 'success', message: t('Deleted') });
				reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal variant='danger' onConfirm={onConfirm} onCancel={() => setModal(null)} confirmText={t('Delete')}>
				{t('Delete_File_Warning')}
			</GenericModal>,
		);
	});

	return handleDelete;
};
