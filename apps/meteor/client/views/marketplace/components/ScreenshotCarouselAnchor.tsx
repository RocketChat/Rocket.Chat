import type { AppScreenshot } from '@rocket.chat/core-typings';
import { Icon, Text } from '@rocket.chat/fuselage';
import { ImageGalleryContext } from '@rocket.chat/ui-client';
import { useContext, useEffect, useState } from 'react';

import ScreenshotPreview from './layout/ScreenshotPreview';

export type ScreenshotCarouselAnchorProps = {
	screenshots: AppScreenshot[];
};

const ScreenshotCarouselAnchor = ({ screenshots }: ScreenshotCarouselAnchorProps) => {
	const ImageGallery = useContext(ImageGalleryContext);
	const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
	const [openedScreenshotId, setOpenedScreenshotId] = useState<string>();

	const { length } = screenshots;

	useEffect(() => {
		const intervalId = setInterval(() => {
			setCurrentPreviewIndex((prevIndex) => (prevIndex === length - 1 ? 0 : prevIndex + 1));
		}, 5000);

		return () => clearInterval(intervalId);
	}, [length]);

	const currentScreenshot = screenshots[currentPreviewIndex];

	return (
		<>
			<ScreenshotPreview
				src={currentScreenshot?.accessUrl}
				alt='App preview image'
				onClick={() => setOpenedScreenshotId(currentScreenshot?.id)}
			>
				<Icon name='image' size='x24' />{' '}
				<Text is='span' fontScale='p2m' color='default'>
					{currentPreviewIndex + 1} of {length}
				</Text>
			</ScreenshotPreview>
			{ImageGallery && openedScreenshotId && (
				<ImageGallery
					images={screenshots.map(({ id, accessUrl }) => ({ _id: id, url: accessUrl, description: 'App preview image' }))}
					initialImageId={openedScreenshotId}
					onClose={() => setOpenedScreenshotId(undefined)}
				/>
			)}
		</>
	);
};

export default ScreenshotCarouselAnchor;
