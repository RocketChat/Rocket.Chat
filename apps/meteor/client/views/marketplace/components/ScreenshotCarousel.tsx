import type { AppScreenshot } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

type ScreenshotCarouselProps = {
	AppScreenshots: Array<AppScreenshot>;
	setViewCarousel: (state: boolean) => void;
	handleNextSlide: () => void;
	handlePrevSlide: () => void;
	isFirstSlide: boolean;
	isLastSlide: boolean;
	currentSlideIndex: number;
};

const ScreenshotCarousel = ({
	AppScreenshots,
	setViewCarousel,
	handleNextSlide,
	handlePrevSlide,
	isFirstSlide,
	isLastSlide,
	currentSlideIndex,
}: ScreenshotCarouselProps): ReactElement => {
	const handleScreenshotRender = (): JSX.Element[] =>
		AppScreenshots.map((currentScreenshot, index) => {
			const isCurrentImageOnScreen = index === currentSlideIndex;
			const screenshotWrapperStyle = isCurrentImageOnScreen
				? {
						opacity: '1',
						transitionDuration: '1s',
						transform: 'scale(1.08)',
					}
				: {
						opacity: '0',
						transitionDuration: '1s ease',
					};

			return (
				<Box style={screenshotWrapperStyle} key={currentScreenshot.id}>
					{isCurrentImageOnScreen && (
						<Box is='img' src={currentScreenshot.accessUrl} alt='Carousel image' maxWidth='x1200' maxHeight='x600' w='100%' height='100%' />
					)}
				</Box>
			);
		});

	return (
		<>
			<Box position='fixed' w='100%' h='100vh' bg='font-pure-black' opacity='0.7' marginBlock='-0.75px' zIndex='2' />

			{!isFirstSlide && (
				<IconButton
					secondary
					icon='chevron-right'
					onClick={handlePrevSlide}
					style={{ top: '50%', left: '10px', cursor: 'pointer', transform: 'translateY(-50%)' }}
					position='absolute'
					zIndex={3}
				/>
			)}

			{!isLastSlide && (
				<IconButton
					secondary
					icon='chevron-left'
					onClick={handleNextSlide}
					style={{ top: '50%', right: '10px', cursor: 'pointer', transform: 'translateY(-50%)' }}
					position='absolute'
					zIndex={3}
				/>
			)}

			<Box
				onClick={(): void => setViewCarousel(false)}
				position='fixed'
				width='100%'
				height='100vh'
				display='flex'
				justifyContent='center'
				alignItems='center'
				zIndex='2'
				mi={38}
			>
				{handleScreenshotRender()}
			</Box>
		</>
	);
};

export default ScreenshotCarousel;
