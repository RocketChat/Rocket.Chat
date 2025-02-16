import type { IUpload } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import GenericModalDoNotAskAgain from '../../../../../components/GenericModal';
import { useDontAskAgain } from '../../../../../hooks/useDontAskAgain';

export const useDeleteFile = (reload: () => void) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const deleteFile = useMethod('deleteFileMessage');
	const dontAskDeleteFile = useDontAskAgain('deleteFile');

	const handleDelete = useEffectEvent(async (_id: IUpload['_id']) => {
		const onConfirm = async () => {
			try {
				await deleteFile(_id);
				dispatchToastMessage({ type: 'success', message: t('Deleted') });
				reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		if (dontAskDeleteFile) {
			onConfirm();
			return;
		}

		setModal(
			<GenericModalDoNotAskAgain
				variant='danger'
				onConfirm={onConfirm}
				onCancel={() => setModal(null)}
				onClose={() => setModal(null)}
				confirmText={t('Delete')}
				cancelText={t('Cancel')}
				dontAskAgain={{
					action: 'deleteFile',
					label: 'Delete File',
				}}
			>
				{t('Delete_File_Warning')}
			</GenericModalDoNotAskAgain>,
		);
	});

	return handleDelete;
};
