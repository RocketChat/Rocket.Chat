import type { AppScreenshot } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';

export type ScreenshotCarouselProps = {
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
}: ScreenshotCarouselProps) => {
	const handleScreenshotRender = () =>
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
						<Box
							is='img'
							src={currentScreenshot.accessUrl}
							alt='Carousel image'
							maxWidth='x1200'
							maxHeight='x600'
							width='100%'
							height='100%'
						/>
					)}
				</Box>
			);
		});

	return (
		<>
			<Box position='fixed' width='100%' height='100vh' backgroundColor='font-pure-black' opacity='0.7' marginBlock='0' zIndex='2' />

			{!isFirstSlide && (
				<Box position='absolute' zIndex={3} style={{ top: '50%', left: '10px', transform: 'translateY(-50%)' }}>
					<IconButton variant='secondary' icon='chevron-right' onClick={handlePrevSlide} />
				</Box>
			)}

			{!isLastSlide && (
				<Box position='absolute' zIndex={3} style={{ top: '50%', right: '10px', transform: 'translateY(-50%)' }}>
					<IconButton variant='secondary' icon='chevron-left' onClick={handleNextSlide} />
				</Box>
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
				marginInline='x40'
			>
				{handleScreenshotRender()}
			</Box>
		</>
	);
};

export default ScreenshotCarousel;
