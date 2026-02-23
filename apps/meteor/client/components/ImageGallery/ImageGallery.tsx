import type { IUpload } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup, IconButton, Palette, PaletteStyleTag, Throbber, padding } from '@rocket.chat/fuselage';
import { useEffect, useRef, useState } from 'react';
import { FocusScope } from 'react-aria';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Navigation, Zoom, Keyboard, A11y } from 'swiper/modules/index.mjs';
import type { SwiperClass, SwiperRef } from 'swiper/swiper-react';
import { Swiper, SwiperSlide } from 'swiper/swiper-react.mjs';

import 'swiper/swiper.css';
import 'swiper/modules/zoom.css';

import { usePreventPropagation } from '../../hooks/usePreventPropagation';

const ZOOM_WHEEL_COOLDOWN_MS = 200;

const swiperStyle = css`
	.swiper {
		width: 100%;
		height: 100%;
	}
	.swiper-container {
		position: absolute;
		z-index: 99;
		top: 0;

		overflow: hidden;

		width: 100%;
		height: 100%;

		background-color: var(--rcx-color-surface-overlay, rgba(0, 0, 0, 0.6));
	}

	.swiper-slide {
		padding: ${padding('x144')} ${padding('x60')} ${padding('x96')};
	}

	.rcx-swiper-prev-button,
	.rcx-swiper-next-button {
		position: absolute;
		z-index: 10;
		top: 50%;

		cursor: pointer;
	}

	.rcx-swiper-prev-button.swiper-button-disabled,
	.rcx-swiper-next-button.swiper-button-disabled {
		cursor: auto;
		pointer-events: none;

		opacity: 0.35;
	}

	.rcx-swiper-prev-button.swiper-button-hidden,
	.rcx-swiper-next-button.swiper-button-hidden {
		cursor: auto;
		pointer-events: none;

		opacity: 0;
	}

	.rcx-swiper-prev-button,
	.swiper-rtl .rcx-swiper-next-button {
		right: auto;
		left: 10px;
	}

	.rcx-swiper-next-button,
	.swiper-rtl .rcx-swiper-prev-button {
		right: 10px;
		left: auto;
	}

	.rcx-lazy-preloader {
		position: absolute;
		z-index: -1;
		left: 50%;
		top: 50%;

		transform: translate(-50%, -50%);

		color: ${Palette.text['font-pure-white']};
	}

	.rcx-swiper-controls {
		position: absolute;
		top: 0;
		right: 0;
		padding: 10px;
		z-index: 2;

		width: 100%;
		display: flex;
		justify-content: flex-end;
		background-color: ${Palette.surface['surface-sidebar']};
	}
`;

export const ImageGallery = ({ images, onClose, loadMore }: { images: IUpload[]; onClose: () => void; loadMore?: () => void }) => {
	const { t } = useTranslation();
	const swiperRef = useRef<SwiperRef>(null);
	const [, setSwiperInst] = useState<SwiperClass>();
	const [zoomScale, setZoomScale] = useState(1);
	const [gridSize, setGridSize] = useState(images.length);

	const handleZoom = (ratio: number) => {
		if (swiperRef.current?.swiper.zoom) {
			const { scale, in: zoomIn } = swiperRef.current?.swiper.zoom;
			setZoomScale(scale + ratio);
			return zoomIn(scale + ratio);
		}
	};

	const handleZoomIn = () => handleZoom(1);
	const handleZoomOut = () => handleZoom(-1);
	const handleResize = () => handleZoom(-(zoomScale - 1));

	const preventPropagation = usePreventPropagation();
	const lastZoomTimeRef = useRef(0);

	useEffect(() => {
		const onWheel = (event: WheelEvent): void => {
			const target = event.target as HTMLElement;
			const zoomContainer = target.closest('.swiper-zoom-container');

			if (!zoomContainer) {
				return;
			}

			const gallery = zoomContainer.closest('.image-gallery');
			if (!gallery) {
				return;
			}

			const now = Date.now();
			if (now - lastZoomTimeRef.current < ZOOM_WHEEL_COOLDOWN_MS) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}

			const zoomInBtn = gallery.querySelector('button[name="zoom-in"]') as HTMLButtonElement | null;
			const zoomOutBtn = gallery.querySelector('button[name="zoom-out"]') as HTMLButtonElement | null;

			if (!zoomInBtn || !zoomOutBtn) {
				return;
			}

			let handled = false;

			if (event.deltaY < 0) {
				if (!zoomInBtn.disabled) {
					zoomInBtn.click();
					handled = true;
				}
			} else if (event.deltaY > 0) {
				if (!zoomOutBtn.disabled) {
					zoomOutBtn.click();
					handled = true;
				}
			}

			if (handled) {
				lastZoomTimeRef.current = now;
				event.preventDefault();
				event.stopPropagation();
			}
		};

		window.addEventListener('wheel', onWheel, { passive: false, capture: true });
		return () => window.removeEventListener('wheel', onWheel, { capture: true });
	}, []);

	return createPortal(
		<>
			<PaletteStyleTag theme='dark' selector='.swiper-container.image-gallery' tagId='image-gallery-palette' />
			<FocusScope contain autoFocus>
				<Box role='dialog' aria-modal='true' aria-label={t('Image_gallery')} className={swiperStyle}>
					<div role='presentation' className='swiper-container image-gallery' onClick={onClose}>
						<ButtonGroup role='toolbar' className='rcx-swiper-controls' onClick={preventPropagation}>
							{zoomScale !== 1 && (
								<IconButton
									name='resize'
									small
									icon='arrow-collapse'
									title={t('Resize')}
									rcx-swiper-zoom-out
									secondary
									onClick={handleResize}
								/>
							)}
							<IconButton
								name='zoom-out'
								small
								icon='h-bar'
								title={t('Zoom_out')}
								rcx-swiper-zoom-out
								onClick={handleZoomOut}
								secondary
								disabled={zoomScale === 1}
							/>
							<IconButton name='zoom-in' small icon='plus' title={t('Zoom_in')} rcx-swiper-zoom-in secondary onClick={handleZoomIn} />
							<IconButton
								name='close'
								small
								icon='cross'
								aria-label={t('Close_gallery')}
								className='rcx-swiper-close-button'
								secondary
								onClick={onClose}
							/>
						</ButtonGroup>
						<IconButton
							icon='chevron-right'
							aria-label={t('Next_image')}
							className='rcx-swiper-prev-button'
							secondary
							onClick={preventPropagation}
						/>
						<IconButton
							icon='chevron-left'
							aria-label={t('Previous_image')}
							className='rcx-swiper-next-button'
							secondary
							onClick={preventPropagation}
						/>
						<Swiper
							ref={swiperRef}
							navigation={{
								nextEl: '.rcx-swiper-next-button',
								prevEl: '.rcx-swiper-prev-button',
							}}
							keyboard
							zoom={{ toggle: false }}
							lazyPreloaderClass='rcx-lazy-preloader'
							runCallbacksOnInit
							onKeyPress={(_: SwiperClass, keyCode: string) => String(keyCode) === '27' && onClose()}
							modules={[Navigation, Zoom, Keyboard, A11y]}
							onInit={(swiper: SwiperClass) => setSwiperInst(swiper)}
							onSlidesGridLengthChange={(swiper: SwiperClass) => {
								swiper.slideTo(images.length - gridSize, 0);
								setGridSize(images.length);
							}}
							onReachBeginning={loadMore}
							initialSlide={images.length - 1}
						>
							{[...images].reverse().map(({ _id, path, url }) => (
								<SwiperSlide key={_id}>
									<div className='swiper-zoom-container'>
										{/* eslint-disable-next-line
											jsx-a11y/no-noninteractive-element-interactions,
											jsx-a11y/click-events-have-key-events
										*/}
										<img src={path || url} loading='lazy' alt='' data-qa-zoom-scale={zoomScale} onClick={preventPropagation} />
										<div className='rcx-lazy-preloader'>
											<Throbber inheritColor />
										</div>
									</div>
								</SwiperSlide>
							))}
						</Swiper>
					</div>
				</Box>
			</FocusScope>
		</>,
		document.body,
	);
};
