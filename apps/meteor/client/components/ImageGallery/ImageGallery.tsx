import { IconButton, ModalBackdrop, Throbber } from '@rocket.chat/fuselage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Keyboard, Navigation, Zoom, A11y } from 'swiper';
import type { SwiperRef } from 'swiper/react';
import { type SwiperClass, Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/swiper.css';
import 'swiper/modules/navigation/navigation.min.css';
import 'swiper/modules/keyboard/keyboard.min.css';
import 'swiper/modules/zoom/zoom.min.css';
import './ImageGallery.styles.css';

import { useRecordList } from '../../hooks/lists/useRecordList';
import { useRoom } from '../../views/room/contexts/RoomContext';
import { useFilesList } from '../../views/room/contextualBar/RoomFiles/hooks/useFilesList';

const ImageGallery = ({ url, onClose, sortByRecent }: { url: string; onClose: () => void; sortByRecent?: boolean; name?: string }) => {
	const room = useRoom();
	const swiperRef = useRef<SwiperRef>(null);

	const [images, setImages] = useState<string[]>([]);
	const [swiperInst, setSwiperInst] = useState<SwiperClass>();
	const [currentSlide, setCurrentSlide] = useState<number>();

	const { filesList, loadMoreItems } = useFilesList(useMemo(() => ({ rid: room._id, type: 'image', text: '' }), [room._id]));
	const { phase, items: filesItems } = useRecordList(filesList);

	useEffect(() => {
		const list = sortByRecent ? [...filesItems] : [...filesItems].reverse();

		if (phase === 'resolved') {
			setImages(list.map((item) => item.url || '').filter(Boolean));
			setCurrentSlide(list.findIndex((item) => url.includes(item._id)));
		}
		return () => swiperInst?.update();
	}, [filesItems, phase, sortByRecent, swiperInst, url]);

	const swiperLoader = (
		<ModalBackdrop display='flex' justifyContent='center'>
			<Throbber />
		</ModalBackdrop>
	);
	if (phase === 'loading' || currentSlide === undefined) {
		return createPortal(swiperLoader, document.body);
	}

	const swiperContainer = (
		<div className='swiper-container'>
			<IconButton icon='cross' aria-label='Close gallery' className='rcx-swiper-close-button' onClick={onClose} />
			<IconButton icon='chevron-right' className='rcx-swiper-prev-button' onClick={() => swiperRef?.current?.swiper.slidePrev()} />
			<IconButton icon='chevron-left' className='rcx-swiper-next-button' onClick={() => swiperRef?.current?.swiper.slideNext()} />
			<Swiper
				ref={swiperRef}
				navigation={{
					nextEl: '.rcx-swiper-next-button',
					prevEl: '.rcx-swiper-prev-button',
				}}
				keyboard
				zoom
				lazyPreloaderClass='rcx-lazy-preloader'
				runCallbacksOnInit
				initialSlide={currentSlide}
				onKeyPress={(_, keyCode) => String(keyCode) === '27' && onClose()}
				modules={[Navigation, Zoom, Keyboard, A11y]}
				onInit={(swiper) => setSwiperInst(swiper)}
				onReachEnd={() => loadMoreItems(images.length - currentSlide, images.length + 1)}
			>
				{images?.map((image, index) => (
					<SwiperSlide key={`${image}-${index}`}>
						<div className='swiper-zoom-container'>
							<img src={image} loading='lazy' />
							<div className='rcx-lazy-preloader'>
								<Throbber />
							</div>
						</div>
					</SwiperSlide>
				))}
			</Swiper>
		</div>
	);
	return createPortal(swiperContainer, document.body);
};

export default ImageGallery;
