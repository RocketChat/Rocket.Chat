import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import type { Crop, PixelCrop } from 'react-image-crop';
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop } from 'react-image-crop';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import 'react-image-crop/dist/ReactCrop.css';

const createImage = (url: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.addEventListener('error', (error) => reject(error));
		image.setAttribute('crossOrigin', 'anonymous');
		image.src = url;
	});

const getCroppedBlob = async (imageSrc: string, crop: PixelCrop, mimeType?: string): Promise<Blob> => {
	const image = await createImage(imageSrc);
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx || !crop.width || !crop.height) {
		throw new Error('Invalid crop selection');
	}

	canvas.width = crop.width;
	canvas.height = crop.height;

	ctx.drawImage(
		image,
		crop.x ?? 0,
		crop.y ?? 0,
		crop.width,
		crop.height,
		0,
		0,
		crop.width,
		crop.height,
	);

	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) {
				resolve(blob);
				return;
			}
			reject(new Error('Failed to crop image'));
		}, mimeType ?? 'image/png');
	});
};

type AvatarCropModalProps = {
	image: string;
	mimeType?: string;
	onConfirm: (blob: Blob) => void;
	onCancel: () => void;
};

const AvatarCropModal = ({ image, mimeType, onConfirm, onCancel }: AvatarCropModalProps) => {
	const { t } = useTranslation();
	const [crop, setCrop] = useState<Crop>();
	const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
	const imgRef = useRef<HTMLImageElement | null>(null);

	const handleImageLoaded = useCallback((img: HTMLImageElement) => {
		imgRef.current = img;
		const nextCrop = centerCrop(
			makeAspectCrop(
				{
					unit: '%',
					width: 90,
				},
				1,
				img.width,
				img.height,
			),
			img.width,
			img.height,
		);
		setCrop(nextCrop);
		setCompletedCrop(convertToPixelCrop(nextCrop, img.width, img.height));
	}, []);

	const handleConfirm = useCallback(async () => {
		if (!completedCrop) {
			return;
		}
		const blob = await getCroppedBlob(image, completedCrop, mimeType);
		onConfirm(blob);
	}, [completedCrop, image, mimeType, onConfirm]);

	return (
		<GenericModal title={t('Crop_image')} onClose={onCancel} onCancel={onCancel} onConfirm={handleConfirm} confirmText={t('Save')}>
			<Box mbe={16}>
				<ReactCrop
					circularCrop
					keepSelection
					crop={crop}
					onChange={(newCrop) => setCrop(newCrop)}
					onComplete={(c) => {
						if (!imgRef.current) {
							return;
						}
						setCompletedCrop(convertToPixelCrop(c, imgRef.current.width, imgRef.current.height));
					}}
					aspect={1}
				>
					<img src={image} alt={t('Crop_image')} onLoad={(e) => handleImageLoaded(e.currentTarget)} />
				</ReactCrop>
			</Box>
		</GenericModal>
	);
};

export default AvatarCropModal;
