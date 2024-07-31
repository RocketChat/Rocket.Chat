import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import GenericPreview from './GenericPreview';
import PreviewSkeleton from './PreviewSkeleton';

type ImagePreviewProps = {
	url: string;
	file: File;
	onRemove: (index: number) => void;
	index: number;
};

const ImagePreview = ({ url, file, onRemove, index }: ImagePreviewProps): ReactElement => {
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);
	const [isHovered, setIsHovered] = useState(false);

	const handleLoad = (): void => setLoading(false);
	const handleError = (): void => {
		setLoading(false);
		setError(true);
	};

	const handleMouseEnter = (): void => setIsHovered(true);
	const handleMouseLeave = (): void => setIsHovered(false);

	const buttonStyle: React.CSSProperties = {
		position: 'absolute',
		right: 0,
		top: 0,
		backgroundColor: 'gray',
		display: isHovered ? 'block' : 'none',
		cursor: 'pointer',
		zIndex: 1,
		color: 'white',
		borderRadius: '100%',
	};

	if (error) {
		return <GenericPreview file={file} onRemove={onRemove} index={index} />;
	}

	return (
		<Box position='relative' onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
			{loading && <PreviewSkeleton />}
			<Box
				is='img'
				src={url}
				maxWidth='150px'
				style={{ objectFit: 'contain', borderRadius: '10px' }}
				onLoad={handleLoad}
				onError={handleError}
				display={loading ? 'none' : 'initial'}
			/>
			<Icon style={buttonStyle} name='cross' size='x20' mis={-2} mie={4} onClick={() => onRemove(index)} />
		</Box>
	);
};

export default ImagePreview;
