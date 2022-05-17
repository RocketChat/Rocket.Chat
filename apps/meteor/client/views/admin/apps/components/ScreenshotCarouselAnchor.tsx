import { AppScreenshot } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import ScreenshotCarousel from './ScreenshotCarousel';

type ScreenshotCarouselAnchorProps = {
	screenshots: AppScreenshot[];
};

type voidFunction = () => void;

const ScreenshotCarouselAnchor = ({ screenshots }: ScreenshotCarouselAnchorProps): ReactElement => {
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
			<Box
				onClick={(): void => setViewCarousel(true)}
				display='flex'
				flexDirection='column'
				maxWidth='x640'
				width='100%'
				style={{
					cursor: 'pointer',
				}}
				tabIndex={0}
			>
				<Box
					is='img'
					src={screenshots[currentPreviewIndex]?.accessUrl}
					alt='App preview image'
					className={[
						css`
							transition: filter 0.2s ease;
							&:hover {
								filter: brightness(90%);
							}
						`,
					]}
				/>

				<Box display='flex' flexDirection='row' bg={colors.n100} pi='x16' pb='x10' alignItems='center'>
					<Icon name='image' size='x24' mie='x8' />{' '}
					<Box is='span' fontWeight={500} fontSize='x14' color={colors.n800}>
						{currentPreviewIndex + 1} of {screenshots.length}
					</Box>
				</Box>
			</Box>
			{isCarouselVisible && carouselPortal}
		</>
	);
};

export default ScreenshotCarouselAnchor;
