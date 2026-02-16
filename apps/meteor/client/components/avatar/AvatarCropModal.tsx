import { css } from '@rocket.chat/css-in-js';
import {
    Box,
    Button,
    Modal,
    ModalClose,
    ModalContent,
    ModalFooter,
    ModalFooterControllers,
    ModalHeader,
    ModalTitle,
    Slider,
} from '@rocket.chat/fuselage';
import type { ReactElement, PointerEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const VIEWPORT = 280;

type AvatarCropModalProps = {
    src: string;
    mimeType?: string;
    onCancel: () => void;
    onConfirm: (payload: { blob: Blob; dataUrl: string }) => void;
};

const clampPosition = (
    imageWidth: number,
    imageHeight: number,
    scale: number,
    nextX: number,
    nextY: number,
) => {
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;

    const minX = Math.min(0, VIEWPORT - scaledWidth);
    const minY = Math.min(0, VIEWPORT - scaledHeight);

    return {
        x: Math.min(0, Math.max(minX, nextX)),
        y: Math.min(0, Math.max(minY, nextY)),
    };
};

const AvatarCropModal = ({ src, mimeType, onCancel, onConfirm }: AvatarCropModalProps): ReactElement => {
    const { t } = useTranslation();
    const [imageElement, setImageElement] = useState<HTMLImageElement>();
    const [{ width, height }, setDimensions] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [minScale, setMinScale] = useState(1);
    const [maxScale, setMaxScale] = useState(3);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragRef = useRef<{ id: number; originX: number; originY: number; startX: number; startY: number }>();

    useEffect(() => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
            const initialScale = Math.max(VIEWPORT / image.naturalWidth, VIEWPORT / image.naturalHeight);
            setScale(initialScale);
            setMinScale(initialScale);
            setMaxScale(Math.max(initialScale * 3, initialScale + 1));
            setPosition({
                x: (VIEWPORT - image.naturalWidth * initialScale) / 2,
                y: (VIEWPORT - image.naturalHeight * initialScale) / 2,
            });
            setImageElement(image);
        };
    }, [src]);

    const handlePointerDown = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!width || !height) {
                return;
            }

            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
                id: event.pointerId,
                originX: position.x,
                originY: position.y,
                startX: event.clientX,
                startY: event.clientY,
            };
        },
        [height, position.x, position.y, width],
    );

    const handlePointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!dragRef.current || dragRef.current.id !== event.pointerId || !width || !height) {
                return;
            }

            const dx = event.clientX - dragRef.current.startX;
            const dy = event.clientY - dragRef.current.startY;

            setPosition((prev) => {
                const nextX = dragRef.current!.originX + dx;
                const nextY = dragRef.current!.originY + dy;
                return clampPosition(width, height, scale, nextX, nextY);
            });
        },
        [height, scale, width],
    );

    const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.id === event.pointerId) {
            dragRef.current = undefined;
        }
    }, []);

    const handleZoomChange = useCallback(
        (nextScale: number) => {
            if (!width || !height) {
                return;
            }

            const center = VIEWPORT / 2;
            const offsetX = center - position.x;
            const offsetY = center - position.y;

            const scaledX = center - (offsetX * nextScale) / scale;
            const scaledY = center - (offsetY * nextScale) / scale;

            const clamped = clampPosition(width, height, nextScale, scaledX, scaledY);
            setScale(nextScale);
            setPosition(clamped);
        },
        [height, position.x, position.y, scale, width],
    );

    const handleConfirm = useCallback(async () => {
        if (!imageElement || !width || !height) {
            return;
        }

        const cropSize = Math.min(1024, Math.min(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = cropSize;
        canvas.height = cropSize;
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const sourceSize = VIEWPORT / scale;
        const sx = (0 - position.x) / scale;
        const sy = (0 - position.y) / scale;

        context.fillStyle = '#fff';
        context.fillRect(0, 0, cropSize, cropSize);
        context.drawImage(imageElement, sx, sy, sourceSize, sourceSize, 0, 0, cropSize, cropSize);

        const type = mimeType || 'image/png';
        const dataUrl = canvas.toDataURL(type);
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((value) => {
                if (!value) {
                    reject(new Error('Unable to crop image'));
                    return;
                }
                resolve(value);
            }, type);
        });

        onConfirm({ blob, dataUrl });
    }, [height, imageElement, mimeType, onConfirm, position.x, position.y, scale, width]);

    const containerStyle = useMemo(
        () =>
            css`
                border-radius: 12px;
                overflow: hidden;
                cursor: grab;
            `,
        [],
    );

    return (
        <Modal open>
            <ModalHeader>
                <ModalTitle>{t('Profile_picture')}</ModalTitle>
                <ModalClose onClick={onCancel} />
            </ModalHeader>
            <ModalContent display='flex' flexDirection='column' gap={16} alignItems='stretch'>
                <Box
                    display='flex'
                    justifyContent='center'
                    alignItems='center'
                    borderColor='neutral-200'
                    borderWidth='1px'
                    borderStyle='solid'
                    borderRadius='x4'
                    p={12}
                >
                    <Box
                        display='flex'
                        alignItems='center'
                        justifyContent='center'
                        bg='neutral-200'
                        style={{ width: VIEWPORT, height: VIEWPORT }}
                        className={containerStyle}
                        position='relative'
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        {width && height ? (
                            <Box
                                is='img'
                                src={src}
                                draggable={false}
                                style={{
                                    width: width * scale,
                                    height: height * scale,
                                    transform: `translate(${position.x}px, ${position.y}px)`,
                                    touchAction: 'none',
                                    userSelect: 'none',
                                }}
                            />
                        ) : null}
                        <Box
                            position='absolute'
                            inset={0}
                            pointerEvents='none'
                            borderColor='primary-500'
                            borderWidth='2px'
                            borderStyle='dashed'
                            borderRadius='x2'
                        />
                    </Box>
                </Box>

                <Box display='flex' flexDirection='column' gap={8} alignItems='stretch'>
                    <Box fontScale='p2' color='hint' display='flex' justifyContent='space-between'>
                        <span>{t('Zoom')}</span>
                        <span>{scale.toFixed(2)}x</span>
                    </Box>
                    <Slider minValue={minScale} maxValue={maxScale} value={scale} step={0.01} onChange={handleZoomChange} />
                </Box>
            </ModalContent>
            <ModalFooter>
                <ModalFooterControllers>
                    <Button secondary onClick={onCancel}>
                        {t('Cancel')}
                    </Button>
                    <Button primary onClick={handleConfirm} disabled={!width || !height}>
                        {t('Save_changes')}
                    </Button>
                </ModalFooterControllers>
            </ModalFooter>
        </Modal>
    );
};

export default AvatarCropModal;
