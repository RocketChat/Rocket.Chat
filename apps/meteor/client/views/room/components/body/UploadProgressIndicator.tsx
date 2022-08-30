import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, UIEvent } from 'react';

type UploadProgressIndicatorProps = {
	name: string;
	percentage: number;
	error?: string;
	onClose?: (event: UIEvent) => void;
};

const UploadProgressIndicator = ({ name, percentage, error, onClose }: UploadProgressIndicatorProps): ReactElement => {
	const t = useTranslation();

	if (error) {
		return (
			<div className='upload-progress color-primary-action-color background-component-color error-background error-border'>
				<div className='upload-progress-text'>{error}</div>
				<button className='upload-progress-close' onClick={onClose}>
					{t('close')}
				</button>
			</div>
		);
	}

	return (
		<div className='upload-progress color-primary-action-color background-component-color'>
			<div className='upload-progress-progress' style={{ width: `${percentage}%` }} />
			<div className='upload-progress-text'>
				[{percentage}%] {name}
			</div>
			<button className='upload-progress-close' onClick={onClose}>
				{t('Cancel')}
			</button>
		</div>
	);
};

export default UploadProgressIndicator;
