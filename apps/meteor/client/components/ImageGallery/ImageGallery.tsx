import type { IUpload } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup, IconButton, Palette, Throbber } from '@rocket.chat/fuselage';
import React, { useRef, useState } from 'react';
import { FocusScope } from 'react-aria';
import { createPortal } from 'react-dom';
import { Keyboard, Navigation, Zoom, A11y } from 'swiper';
import type { SwiperRef } from 'swiper/react';
import { type SwiperClass, Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/swiper.css';
import 'swiper/modules/navigation/navigation.min.css';
import 'swiper/modules/keyboard/keyboard.min.css';
import 'swiper/modules/zoom/zoom.min.css';

import { usePreventPropagation } from '../../hooks/usePreventPropagation';

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

	.rcx-swiper-close-button,
	.rcx-swiper-prev-button,
	.rcx-swiper-next-button {
		color: var(--rcx-color-font-pure-white, #ffffff) !important;
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
		left: auto;
		right: 10px;
	}

	.rcx-swiper-next-button,
	.swiper-rtl .rcx-swiper-prev-button {
		left: 10px;
		right: auto;
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
		transition: background-color 0.2s;
		&:hover {
			background-color: ${Palette.surface['surface-overlay']};
			transition: background-color 0.2s;
		}
	}
`;

export const ImageGallery = ({ images, onClose, loadMore }: { images: IUpload[]; onClose: () => void; loadMore?: () => void }) => {
	const swiperRef = useRef<SwiperRef>(null);
	const [, setSwiperInst] = useState<SwiperClass>();
	const [zoomScale, setZoomScale] = useState(1);

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

	return createPortal(
		<FocusScope contain autoFocus>
			<Box className={swiperStyle}>
				<div role='presentation' className='swiper-container' onClick={onClose}>
					<ButtonGroup className='rcx-swiper-controls' onClick={preventPropagation}>
						{zoomScale !== 1 && <IconButton small icon='arrow-collapse' title='Resize' rcx-swiper-zoom-out onClick={handleResize} />}
						<IconButton small icon='h-bar' title='Zoom out' rcx-swiper-zoom-out onClick={handleZoomOut} disabled={zoomScale === 1} />
						<IconButton small icon='plus' title='Zoom in' rcx-swiper-zoom-in onClick={handleZoomIn} />
						<IconButton small icon='cross' title='Close' aria-label='Close gallery' className='rcx-swiper-close-button' onClick={onClose} />
					</ButtonGroup>
					<IconButton icon='chevron-right' className='rcx-swiper-next-button' onClick={preventPropagation} />
					<IconButton icon='chevron-left' className='rcx-swiper-prev-button' onClick={preventPropagation} />
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
						onKeyPress={(_, keyCode) => String(keyCode) === '27' && onClose()}
						modules={[Navigation, Zoom, Keyboard, A11y]}
						onInit={(swiper) => setSwiperInst(swiper)}
						onReachEnd={loadMore}
						dir='rtl'
					>
						{images?.map(({ _id, url }) => (
							<SwiperSlide key={_id}>
								<div className='swiper-zoom-container'>
									<span tabIndex={0} role='link' onClick={preventPropagation} onKeyDown={preventPropagation}>
										<img src={url} loading='lazy' alt='' />
									</span>

									<div className='rcx-lazy-preloader'>
										<Throbber inheritColor />
									</div>
								</div>
							</SwiperSlide>
						))}
					</Swiper>
				</div>
			</Box>
		</FocusScope>,
		document.body,
	);
};
