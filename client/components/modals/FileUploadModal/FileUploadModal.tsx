import { Modal, Box } from '@rocket.chat/fuselage';
import React, { ReactElement, memo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import FilePreview from './FilePreview';

type FileUploadModalProps = {
	onClose: () => void;
	file: File;
};

const FileUploadModal = ({ onClose, file }: FileUploadModalProps): ReactElement => {
	const t = useTranslation();

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('FileUpload')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box display='flex' maxHeight='x360' w='full' justifyContent='center' alignContent='center'>
					<FilePreview file={file} />
				</Box>
			</Modal.Content>
			<Modal.Footer></Modal.Footer>
		</Modal>
	);
};

export default memo(FileUploadModal);
