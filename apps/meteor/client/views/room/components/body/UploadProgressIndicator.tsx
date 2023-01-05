import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import type { Upload } from '../../../../lib/chats/Upload';
import ErroredUploadProgressIndicator from './ErroredUploadProgressIndicator';

type UploadProgressIndicatorProps = {
	id: Upload['id'];
	name: string;
	percentage: number;
	error?: string;
	onClose?: (id: Upload['id']) => void;
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
