import type { AppScreenshot } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ScreenshotSlide from './layout/ScreenshotSlide';
import ScreenshotViewer from './layout/ScreenshotViewer';

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
	const { t } = useTranslation();

	return (
		<ScreenshotViewer
			previous={
				!isFirstSlide && <IconButton variant='secondary' icon='chevron-left' aria-label={t('Previous_image')} onClick={handlePrevSlide} />
			}
			next={!isLastSlide && <IconButton variant='secondary' icon='chevron-right' aria-label={t('Next_image')} onClick={handleNextSlide} />}
			onClose={() => setViewCarousel(false)}
		>
			{AppScreenshots.map((currentScreenshot, index) => (
				<ScreenshotSlide
					key={currentScreenshot.id}
					current={index === currentSlideIndex}
					src={currentScreenshot.accessUrl}
					alt='Carousel image'
				/>
			))}
		</ScreenshotViewer>
	);
};

export default ScreenshotCarousel;
