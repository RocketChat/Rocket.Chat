import { Box, Button, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ReactElement, useState } from 'react';

import { Screenshot } from '../definitions/AppInfo';

type ScreenshotCarouselProps = {
	AppScreenshots: Array<Screenshot>;
	setViewCarousel: React.Dispatch<React.SetStateAction<boolean>>;
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
	return (
		<>
			<Box position='fixed' w='100%' h='100vh' bg={colors.n800} opacity='0.7' zIndex='2' marginBlock='-0.75px' />

			{!isFirstSlide && (
				<Button
					onClick={handlePrevSlide}
					display='flex'
					alignItems='center'
					justifyContent='center'
					style={{ top: '50%', left: '10px', cursor: 'pointer', transform: 'translateY(-50%)' }}
					position='absolute'
					zIndex={3}
					borderRadius='x2'
					w='x28'
					h='x28'
					margin='0'
					bg={colors.n600}
					borderColor={colors.n600}
				>
					<Icon name='chevron-right' size='x24' color='alternative' />
				</Button>
			)}

			{!isLastSlide && (
				<Button
					onClick={handleNextSlide}
					display='flex'
					alignItems='center'
					justifyContent='center'
					style={{ top: '50%', right: '10px', cursor: 'pointer', transform: 'translateY(-50%)' }}
					position='absolute'
					zIndex={3}
					borderRadius='x2'
					w='x28'
					h='x28'
					margin='0'
					bg={colors.n600}
					borderColor={colors.n600}
				>
					<Icon name='chevron-left' size='x24' color='alternative' />
				</Button>
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
				mi='x38'
			>
				{AppScreenshots.map((currentScreenshot, index) => {
					const isCurrentImageOnScreen = index === currentSlideIndex;

					return (
						<Box
							style={
								isCurrentImageOnScreen
									? {
											opacity: '1',
											transitionDuration: '1s',
											transform: 'scale(1.08)',
									  }
									: {
											opacity: '0',
											transitionDuration: '1s ease',
									  }
							}
							key={currentScreenshot.id}
						>
							{index === currentSlideIndex && (
								<Box
									is='img'
									src={currentScreenshot.accessUrl}
									alt='Carousel image'
									maxWidth='x1200'
									maxHeight='x600'
									w='100%'
									height='100%'
								/>
							)}
						</Box>
					);
				})}
			</Box>
		</>
	);
};

export default ScreenshotCarousel;
