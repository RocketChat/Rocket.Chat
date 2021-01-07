import React, { memo, FC, useState, useMemo } from 'react';
import { Box, Icon, BoxProps } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import colors from '@rocket.chat/fuselage-tokens/colors';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { useAttachmentDimensions } from '../context/AttachmentContext';

export type Dimensions = {
	width: number;
	height: number;
};


export type ImageProps = {
	previewUrl?: string;
	src: string;
} & Dimensions;

const ImageBox: FC<BoxProps> = (props) => <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center' alignContent='center' borderRadius='x2' borderWidth='x2' borderStyle='solid' borderColor='neutral-200' {...props}/>;

export const Retry: FC<Dimensions & { retry: () => void }> = ({ retry, ...props }) => {
	const t = useTranslation();
	const clickable = css`
        cursor: pointer;
        background: var(--rxc-color-neutral-100, ${ colors.n100 }) !important;

        &:hover,
        &:focus {
            background: var(--rxc-color-neutral-300, ${ colors.n300 }) !important;
        }
    `;
	return <ImageBox className={clickable} {...props} onClick={retry}>
		<Icon name='refresh' color='neutral-700' size='x64'/>
		<Box fontScale='h1' color='default'>{t('Retry')}</Box>
	</ImageBox>;
};

export const RawImage: FC<ImageProps> = (props) => <Box is='img' {...props} display='block'/>;

const getDimensions = (width: Dimensions['width'], height: Dimensions['height'], limits: { width: number; height: number }): { width: 'auto' | number; height: 'auto' | number } => {
	const ratio = height / width;
	if (height >= width || Math.min(width, limits.width) * ratio > limits.height) {
		return { width: 'auto', height: Math.min(height, limits.height) };
	}

	return { width: Math.min(width, limits.width), height: 'auto' };
};

const Image: FC<ImageProps> = ({ previewUrl, src, ...size }) => {
	const limits = useAttachmentDimensions();
	const { width = limits.width, height = limits.height } = size;
	const [error, setError] = useState(false);

	const { setHasError, setHasNoError } = useMemo(() => ({
		setHasError: (): void => setError(true),
		setHasNoError: (): void => setError(false),
	}), []);

	const dimensions = getDimensions(width, height, limits);

	if (error) {
		return <Retry width={width} height={height} retry={setHasNoError}/>;
	}

	return <ImageBox onError={setHasError} { ...dimensions } bg={previewUrl} src={src} is='img'/>;
};


export default memo(Image);
