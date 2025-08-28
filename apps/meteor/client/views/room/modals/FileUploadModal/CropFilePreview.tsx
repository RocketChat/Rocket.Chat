import { useState, useCallback, useEffect, type ReactElement } from 'react';
import type { Area } from 'react-easy-crop';
import Cropper from 'react-easy-crop';

import GenericPreview from './GenericPreview';
import MediaPreview from './MediaPreview';
import { isIE11 } from '../../../../lib/utils/isIE11';

export enum FilePreviewType {
	IMAGE = 'image',
	AUDIO = 'audio',
	VIDEO = 'video',
}

const getFileType = (fileType: File['type']): FilePreviewType | undefined => {
	if (!fileType) {
		return;
	}
	for (const type of Object.values(FilePreviewType)) {
		if (fileType.indexOf(type) > -1) {
			return type;
		}
	}
};

const shouldShowMediaPreview = (file: File, fileType: FilePreviewType | undefined): boolean => {
	if (!fileType) {
		return false;
	}
	if (isIE11) {
		return false;
	}
	// Avoid preview if file size bigger than 10mb
	if (file.size > 10000000) {
		return false;
	}
	if (!Object.values(FilePreviewType).includes(fileType)) {
		return false;
	}
	return true;
};

async function getCroppedFile(imageSrc: string, crop: Area, original: File): Promise<File | null> {
	const image = new Image();
	image.src = imageSrc;
	await new Promise((resolve, reject) => {
		image.onload = resolve;
		image.onerror = reject;
	});

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;

	canvas.width = Math.round(crop.width);
	canvas.height = Math.round(crop.height);

	ctx.drawImage(
		image,
		Math.round(crop.x),
		Math.round(crop.y),
		Math.round(crop.width),
		Math.round(crop.height),
		0,
		0,
		Math.round(crop.width),
		Math.round(crop.height),
	);

	const mime = original.type && original.type.startsWith('image/') ? original.type : 'image/jpeg';
	const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.95));
	if (!blob) return null;

	const dot = original.name.lastIndexOf('.');
	const base = dot > 0 ? original.name.slice(0, dot) : original.name;
	const ext = dot > 0 ? original.name.slice(dot) : '.jpg';
	const name = `${base}-cropped${ext}`;

	return new File([blob], name, { type: blob.type, lastModified: Date.now() });
}

type FilePreviewProps = {
	file: File;
	onFileChange?: (file: File) => void;
	startCropping?: boolean;
	onCropDone?: () => void;
};

const CropFilePreview = ({ file, onFileChange, startCropping, onCropDone }: FilePreviewProps): ReactElement => {
	const fileType = getFileType(file.type);

	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedArea, setCroppedArea] = useState<Area | null>(null);
	const [croppedImageURL, setCroppedImageURL] = useState<string | null>(null);
	const [isCroppingInternal, setIsCroppingInternal] = useState(false);

	const objUrl = URL.createObjectURL(file);

	useEffect(() => {
		if (startCropping) setIsCroppingInternal(true);
	}, [startCropping]);

	const onCropComplete = useCallback((_area: Area, croppedAreaPixels: Area) => {
		setCroppedArea(croppedAreaPixels);
	}, []);

	const handleCropDone = useCallback(async () => {
		if (!croppedArea) return;
		const croppedFile = await getCroppedFile(objUrl, croppedArea, file);
		if (!croppedFile) return;

		const previewUrl = URL.createObjectURL(croppedFile);
		setCroppedImageURL(previewUrl);
		onFileChange?.(croppedFile);
		setIsCroppingInternal(false);
		onCropDone?.();
	}, [file, croppedArea, objUrl, onFileChange, onCropDone]);

	if (fileType === FilePreviewType.IMAGE && !croppedImageURL && isCroppingInternal) {
		return (
			<div style={{ position: 'relative', width: '100%', height: 320 }}>
				<Cropper
					image={objUrl}
					crop={crop}
					zoom={zoom}
					aspect={undefined}
					onCropChange={setCrop}
					onZoomChange={setZoom}
					onCropComplete={onCropComplete}
				/>
				<button type='button' onClick={handleCropDone} style={{ position: 'absolute', bottom: 12, left: 12 }}>
					Crop
				</button>
			</div>
		);
	}

	if (croppedImageURL) {
		return <img src={croppedImageURL} alt='Cropped preview' style={{ maxWidth: '100%', maxHeight: 320 }} />;
	}

	if (shouldShowMediaPreview(file, fileType)) {
		return <MediaPreview file={file} fileType={fileType as FilePreviewType} />;
	}

	return <GenericPreview file={file} />;
};

export default CropFilePreview;
