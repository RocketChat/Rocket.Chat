import { Box } from '@rocket.chat/fuselage';
import React, { useState, ReactElement } from 'react';

import GenericPreview from './GenericPreview';
import PreviewSkeleton from './PreviewSkeleton';

type ImagePreviewProps = {
	url: string;
	file: File;
};

const ImagePreview = ({ url, file }: ImagePreviewProps): ReactElement => {
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);

	const handleLoad = (): void => setLoading(false);
	const handleError = (): void => {
		setLoading(false);
		setError(true);
	};

	if (error) {
		return <GenericPreview file={file} />;
	}

	return (
		<>
			{loading && <PreviewSkeleton />}
			<Box
				is='img'
				src={url}
				maxWidth='full'
				style={{ objectFit: 'contain' }}
				onLoad={handleLoad}
				onError={handleError}
				display={loading ? 'none' : 'initial'}
			/>
		</>
	);
};

export default ImagePreview;
