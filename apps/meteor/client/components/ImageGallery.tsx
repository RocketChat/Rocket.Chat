// Import Swiper React components

import { IconButton, Throbber } from '@rocket.chat/fuselage';
import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Navigation, Zoom, A11y } from 'swiper';
import { type SwiperClass, Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/swiper.css';
import 'swiper/modules/navigation/navigation.min.css';
import 'swiper/modules/keyboard/keyboard.min.css';
import 'swiper/modules/zoom/zoom.min.css';
import { useRecordList } from '../hooks/lists/useRecordList';
import { useRoom } from '../views/room/contexts/RoomContext';
import { useFilesList } from '../views/room/contextualBar/RoomFiles/hooks/useFilesList';

const ImageGallery = ({ url, onClose }: { url: string; onClose: () => void }) => {
	const room = useRoom();

	const [images, setImages] = useState<string[]>();
	const [swiperInst, setSwiperInst] = useState<SwiperClass>();
	const [currentSlide, setCurrentSlide] = useState<number>();

	const { filesList } = useFilesList(useMemo(() => ({ rid: room._id, type: 'image', text: '' }), [room._id]));
	const { phase, items: filesItems } = useRecordList(filesList);

	useEffect(() => {
		const list = [...filesItems].reverse();

		if (phase === 'resolved') {
			setImages(list.map((item) => item.url || '').filter(Boolean));
			setCurrentSlide(list.findIndex((item) => url.includes(item._id)));
		}
		return () => swiperInst?.update();
	}, [filesItems, phase, swiperInst, url]);

	if (phase === 'loading' || currentSlide === undefined) {
		return null;
	}

	return (
		<div className='swiper-container'>
			<IconButton icon='cross' onClick={onClose} />
			<Swiper
				navigation
				keyboard
				zoom
				lazyPreloaderClass='rcx-lazy-preloader'
				runCallbacksOnInit
				initialSlide={currentSlide}
				onKeyPress={(_, keyCode) => String(keyCode) === '27' && onClose()}
				modules={[Navigation, Zoom, Keyboard, A11y]}
				onInit={(swiper) => setSwiperInst(swiper)}
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
};

export default ImageGallery;
