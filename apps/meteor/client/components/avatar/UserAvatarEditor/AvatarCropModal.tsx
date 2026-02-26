import {
	Button,
	Modal,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	Box,
	Slider,
	Icon,
	ModalBackdrop,
} from '@rocket.chat/fuselage';
import React, { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type AvatarCropModalProps = {
	imageSrc: string;
	onApply: (croppedImage: string) => void;
	onCancel: () => void;
};

const AvatarCropModal = ({ imageSrc, onApply, onCancel }: AvatarCropModalProps): ReactElement => {
	const { t } = useTranslation();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

	const [zoom, setZoom] = useState(100);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);

	const onMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		setIsDragging(true);
		dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
	};

	const onMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		if (!isDragging) return;
		setOffset({
			x: e.clientX - dragStart.current.x,
			y: e.clientY - dragStart.current.y,
		});
	};

	const onMouseUp = () => {
		setIsDragging(false);
	};

	useEffect(() => {
		setZoom(100);
		setOffset({ x: 0, y: 0 });
	}, [imageSrc]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !imageSrc) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const img = new Image();
		img.src = imageSrc;

		img.onload = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const baseScale = 300 / Math.min(img.width, img.height);
			const actualZoom = zoom / 100;

			const scaledWidth = img.width * baseScale * actualZoom;
			const scaledHeight = img.height * baseScale * actualZoom;

			const centerX = (canvas.width - scaledWidth) / 2 + offset.x;
			const centerY = (canvas.height - scaledHeight) / 2 + offset.y;

			ctx.drawImage(img, centerX, centerY, scaledWidth, scaledHeight);
		};
	}, [imageSrc, zoom, offset]);

	const handleApply = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const exportCanvas = document.createElement('canvas');
		exportCanvas.width = 300;
		exportCanvas.height = 300;

		const exportCtx = exportCanvas.getContext('2d');
		if (!exportCtx) return;

		exportCtx.drawImage(canvas, (1000 - 300) / 2, (1000 - 300) / 2, 300, 300, 0, 0, 300, 300);

		const croppedDataUrl = exportCanvas.toDataURL('image/png');
		onApply(croppedDataUrl);
	};

	return (
		<ModalBackdrop display='flex' justifyContent='center' color='pure-white'>
			<Modal>
				<ModalHeader>
					<ModalTitle>{t('Crop_Image')}</ModalTitle>
					<ModalClose onClick={onCancel} />
				</ModalHeader>

				<ModalContent>
					<Box display='flex' justifyContent='center' alignItems='center' height='300px'>
						<Box
							width='300px'
							height='300px'
							overflow='hidden'
							position='relative'
							borderRadius='50%'
							style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
							onMouseDown={onMouseDown}
							onMouseMove={onMouseMove}
							onMouseUp={onMouseUp}
							onMouseLeave={onMouseUp}
						>
							<canvas
								ref={canvasRef}
								width={1000}
								height={1000}
								style={{
									position: 'absolute',
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)',
								}}
							/>
						</Box>
					</Box>

					<Box display='flex' alignItems='center' mbs={16}>
						<Icon name='magnifier' size='x16' mie={8} />
						<Slider value={zoom} minValue={50} maxValue={300} onChange={(val: number) => setZoom(val)} />
					</Box>
				</ModalContent>

				<ModalFooter>
					<ModalFooterControllers>
						<Button secondary onClick={onCancel}>
							{t('Cancel')}
						</Button>
						<Button primary onClick={handleApply}>
							{t('Apply')}
						</Button>
					</ModalFooterControllers>
				</ModalFooter>
			</Modal>
		</ModalBackdrop>
	);
};

export default AvatarCropModal;
