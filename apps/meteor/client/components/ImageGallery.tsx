// Import Swiper React components

import React, { useEffect, useState } from 'react';
import { Navigation, Zoom } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/swiper.css';
import 'swiper/modules/navigation/navigation.min.css';
import 'swiper/modules/zoom/zoom.min.css';
// import './ImageGallery.css';

const ImageGallery = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [images, setImages] = useState([]);
	const [swiperInst, setSwiperInst] = useState<typeof Swiper>(null);

	useEffect(() => {
		document.addEventListener('click', (event) => {
			const nodes = document.querySelectorAll('.gallery-item');
			console.log(nodes);
			if (event.target.classList.contains('gallery-item')) {
				console.log('isEvent');
				setIsOpen(true);
				const sources = [...nodes].map((node) => node.src);
				setImages(sources);
				console.log(swiperInst);
				// swiperInst.update();
			}
			// console.log(event.target.classList.contains('gallery-item'));
		});
	}, [swiperInst]);

	console.log(images);

	return (
		isOpen && (
			<div className='swiper-container'>
				<Swiper
					navigation={true}
					zoom={true}
					onSlideChange={() => console.log('slide change')}
					onSwiper={(swiper) => console.log(swiper)}
					modules={[Navigation, Zoom]}
					onInit={(swiper) => {
						console.log(swiper);
						setSwiperInst(swiper);
						console.log('init');
						const nodes = document.querySelectorAll('.gallery-item');
						console.log(nodes);
					}}
				>
					{images.map((image) => (
						<img src={image} />
					))}
					<SwiperSlide>
						<div className='swiper-zoom-container'>
							<img src='https://swiperjs.com/demos/images/nature-1.jpg' />
						</div>
					</SwiperSlide>
					<SwiperSlide>
						<div className='swiper-zoom-container'>
							<img src='https://swiperjs.com/demos/images/nature-2.jpg' />
						</div>
					</SwiperSlide>
					<SwiperSlide>
						<div className='swiper-zoom-container'>
							<img src='https://swiperjs.com/demos/images/nature-3.jpg' />
						</div>
					</SwiperSlide>
					<SwiperSlide>
						<div className='swiper-zoom-container'>
							<img src='https://swiperjs.com/demos/images/nature-4.jpg' />
						</div>
					</SwiperSlide>
					<SwiperSlide>
						<div className='swiper-zoom-container'>
							<img src='https://swiperjs.com/demos/images/nature-5.jpg' />
						</div>
					</SwiperSlide>
					<SwiperSlide>
						<div className='swiper-zoom-container'>
							<img src='https://swiperjs.com/demos/images/nature-6.jpg' />
						</div>
					</SwiperSlide>
					<SwiperSlide>
						<div className='swiper-zoom-container'>
							<img src='https://swiperjs.com/demos/images/nature-7.jpg' />
						</div>
					</SwiperSlide>
					<SwiperSlide>
						<div className='swiper-zoom-container'>
							<img src='https://swiperjs.com/demos/images/nature-8.jpg' />
						</div>
					</SwiperSlide>
					<SwiperSlide>
						<div className='swiper-zoom-container'>
							<img src='https://swiperjs.com/demos/images/nature-9.jpg' />
						</div>
					</SwiperSlide>
				</Swiper>
			</div>
		)
	);
};

export default ImageGallery;