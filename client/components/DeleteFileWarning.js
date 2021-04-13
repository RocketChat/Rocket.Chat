import React from 'react';

import { useTranslation } from '../contexts/TranslationContext';
import DeleteWarningModal from './DeleteWarningModal';

const DeleteFileWarning = ({ onConfirm, onCancel }) => {
	const t = useTranslation();
	return (
		<DeleteWarningModal onCancel={onCancel} onDelete={onConfirm}>
			{t('Delete_File_Warning')}
		</DeleteWarningModal>
	);
};

export default DeleteFileWarning;
