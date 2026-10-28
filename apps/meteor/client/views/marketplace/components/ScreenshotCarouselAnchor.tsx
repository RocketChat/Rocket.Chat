import type { AppScreenshot } from '@rocket.chat/core-typings';
import { Icon, Text } from '@rocket.chat/fuselage';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import ScreenshotCarousel from './ScreenshotCarousel';
import ScreenshotPreview from './layout/ScreenshotPreview';

export type ScreenshotCarouselAnchorProps = {
	screenshots: AppScreenshot[];
};

type voidFunction = () => void;

const ScreenshotCarouselAnchor = ({ screenshots }: ScreenshotCarouselAnchorProps) => {
	const [viewCarousel, setViewCarousel] = useState(false);

	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

	const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

	const { length } = screenshots;

	const isFirstSlide = currentSlideIndex === 0;
	const isLastSlide = currentSlideIndex === length - 1;

	const isCarouselVisible = viewCarousel && screenshots?.length;

	const handleNextSlide = (): void => {
		setCurrentSlideIndex(currentSlideIndex + 1);
	};

	const handlePrevSlide = (): void => {
		setCurrentSlideIndex(currentSlideIndex - 1);
	};

	const handleKeyboardKey = useCallback(
		(onKeyDownEvent: KeyboardEvent): void => {
			const keysObject: Record<string, voidFunction> = {
				ArrowLeft: () => setCurrentSlideIndex((prevSlideIndex) => (prevSlideIndex !== 0 ? prevSlideIndex - 1 : 0)),
				ArrowRight: () => setCurrentSlideIndex((prevSlideIndex) => (prevSlideIndex !== length - 1 ? prevSlideIndex + 1 : length - 1)),
				Escape: () => setViewCarousel(false),
			};

			keysObject[onKeyDownEvent.key]();
		},
		[length],
	);

	useEffect(() => {
		const intervalId = setInterval(() => {
			setCurrentPreviewIndex((prevIndex) => {
				if (prevIndex === length - 1) return 0;

				return prevIndex + 1;
			});
		}, 5000);

		document.addEventListener('keydown', handleKeyboardKey);

		return (): void => {
			clearInterval(intervalId);
			document.removeEventListener('keydown', handleKeyboardKey);
		};
	}, [handleKeyboardKey, length]);

	const carouselPortal = createPortal(
		<ScreenshotCarousel
			AppScreenshots={screenshots}
			setViewCarousel={setViewCarousel}
			handleNextSlide={handleNextSlide}
			handlePrevSlide={handlePrevSlide}
			isFirstSlide={isFirstSlide}
			isLastSlide={isLastSlide}
			currentSlideIndex={currentSlideIndex}
		/>,
		document.body,
	);

	return (
		<>
			<ScreenshotPreview src={screenshots[currentPreviewIndex]?.accessUrl} alt='App preview image' onClick={() => setViewCarousel(true)}>
				<Icon name='image' size='x24' />{' '}
				<Text is='span' fontScale='p2m' color='default'>
					{currentPreviewIndex + 1} of {screenshots.length}
				</Text>
			</ScreenshotPreview>
			{isCarouselVisible && carouselPortal}
		</>
	);
};

export default ScreenshotCarouselAnchor;
