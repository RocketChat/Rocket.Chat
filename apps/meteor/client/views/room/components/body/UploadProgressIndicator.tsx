import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback } from 'react';

import { Uploading } from '../../../../../app/ui/client/lib/fileUpload';
import ErroredUploadProgressIndicator from './ErroredUploadProgressIndicator';

type UploadProgressIndicatorProps = {
	id: Uploading['id'];
	name: string;
	percentage: number;
	error?: string;
	onClose?: (id: Uploading['id']) => void;
};

const UploadProgressIndicator = ({ id, name, percentage, error, onClose }: UploadProgressIndicatorProps): ReactElement => {
	const t = useTranslation();

	const handleCloseClick = useCallback(() => {
		onClose?.(id);
	}, [id, onClose]);

	if (error) {
		return <ErroredUploadProgressIndicator id={id} error={error} onClose={onClose} />;
	}

	return (
		<div className='upload-progress color-primary-action-color background-component-color'>
			<div className='upload-progress-progress' style={{ width: `${percentage}%` }} />
			<div className='upload-progress-text'>
				[{percentage}%] {name}
			</div>
			<button type='button' className='upload-progress-close' onClick={handleCloseClick}>
				{t('Cancel')}
			</button>
		</div>
	);
};

export default UploadProgressIndicator;
