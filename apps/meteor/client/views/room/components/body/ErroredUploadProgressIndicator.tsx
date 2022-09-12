import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback } from 'react';

import { Uploading } from '../../../../../app/ui/client/lib/fileUpload';

type ErroredUploadProgressIndicatorProps = {
	id: Uploading['id'];
	error: string;
	onClose?: (id: Uploading['id']) => void;
};

const ErroredUploadProgressIndicator = ({ id, error, onClose }: ErroredUploadProgressIndicatorProps): ReactElement => {
	const t = useTranslation();

	const handleCloseClick = useCallback(() => {
		onClose?.(id);
	}, [id, onClose]);

	return (
		<div className='upload-progress color-primary-action-color background-component-color error-background error-border'>
			<div className='upload-progress-text'>{error}</div>
			<button type='button' className='upload-progress-close' onClick={handleCloseClick}>
				{t('close')}
			</button>
		</div>
	);
};

export default ErroredUploadProgressIndicator;
