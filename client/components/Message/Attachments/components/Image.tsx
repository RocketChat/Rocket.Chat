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
	loadImage?: boolean;
	setLoadImage: () => void;
} & Dimensions & ({ loadImage: true } | { loadImage: false; setLoadImage: () => void });

const ImageBox: FC<BoxProps> = (props) => <Box display='flex' maxWidth='full' flexDirection='column' justifyContent='center' alignItems='center' alignContent='center' borderRadius='x2' borderWidth='x2' borderStyle='solid' borderColor='neutral-200' {...props}/>;

export const Retry: FC<BoxProps & { retry: () => void }> = ({ retry }) => {
	const t = useTranslation();
	const clickable = css`
        cursor: pointer;
        background: var(--rxc-color-neutral-100, ${ colors.n100 }) !important;

        &:hover,
        &:focus {
            background: var(--rxc-color-neutral-300, ${ colors.n300 }) !important;
        }
    `;
	return <ImageBox className={clickable} onClick={retry} size={160}>
		<Icon name='refresh' color='neutral-700' size='x64'/>
		<Box fontScale='h1' color='default'>{t('Retry')}</Box>
	</ImageBox>;
};

export const Load: FC<BoxProps & { load: () => void }> = ({ load, ...props }) => {
	const t = useTranslation();
	const clickable = css`
        cursor: pointer;
        background: var(--rxc-color-neutral-100, ${ colors.n100 }) !important;

        &:hover,
        &:focus {
            background: var(--rxc-color-neutral-300, ${ colors.n300 }) !important;
        }
    `;
	return <ImageBox className={clickable} {...props} onClick={load}>
		<Icon name='image' color='neutral-700' size='x64'/>
		<Box fontScale='h1' color='default'>{t('Click_to_load')}</Box>
	</ImageBox>;
};


const getDimensions = (width: Dimensions['width'], height: Dimensions['height'], limits: { width: number; height: number }): { width: 'auto' | number; height: 'auto' | number } => {
	const ratio = height / width;

	if (height >= width || Math.min(width, limits.width) * ratio > limits.height) {
		return { width: width * Math.min(height, limits.height) / height, height: 'auto' };
	}

	return { width: Math.min(width, limits.width), height: 'auto' };
};

const Image: FC<ImageProps> = ({ previewUrl, loadImage = true, setLoadImage, src, ...size }) => {
	const limits = useAttachmentDimensions();
	const { width = limits.width, height = limits.height } = size;
	const [error, setError] = useState(false);

	const { setHasError, setHasNoError } = useMemo(() => ({
		setHasError: (): void => setError(true),
		setHasNoError: (): void => setError(false),
	}), []);

	const dimensions = getDimensions(width, height, limits);

	const background = previewUrl && `url(${ previewUrl }) center center / cover no-repeat fixed`;

	if (!loadImage) {
		return <Load { ...limits } load={setLoadImage}/>;
	}

	if (error) {
		return <Retry retry={setHasNoError}/>;
	}

	return <ImageBox className='gallery-item' onError={setHasError} {...previewUrl && { style: { background } } as any } { ...dimensions } src={src} is='img'/>;
};


export default memo(Image);
