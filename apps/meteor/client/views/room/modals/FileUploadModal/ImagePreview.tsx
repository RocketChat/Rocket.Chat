import { Box } from '@rocket.chat/fuselage';
import { useState } from 'react';

import GenericPreview from './GenericPreview';
import PreviewSkeleton from './PreviewSkeleton';

type ImagePreviewProps = {
	url: string;
	file: File;
	alt?: string;
};

const ImagePreview = ({ url, file, alt = '' }: ImagePreviewProps) => {
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
				alt={alt}
				maxWidth='full'
				objectFit='contain'
				onLoad={handleLoad}
				onError={handleError}
				display={loading ? 'none' : 'initial'}
			/>
		</>
	);
};

export default ImagePreview;
