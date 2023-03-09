import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import type { Upload } from '../../../../lib/chats/Upload';

type ErroredUploadProgressIndicatorProps = {
	id: Upload['id'];
	error: string;
	onClose?: (id: Upload['id']) => void;
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
