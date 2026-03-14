import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useCallback, useEffect, useState } from 'react';

type ScreenshotCarouselAnchorProps = {
	screenshots: { id: string; accessUrl: string; altText?: string }[];
};

const ScreenshotCarouselAnchor = ({ screenshots }: ScreenshotCarouselAnchorProps) => {
	const [viewCarousel, setViewCarousel] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	const goToPrev = useCallback(() => {
		setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
	}, [screenshots.length]);

	const goToNext = useCallback(() => {
		setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
	}, [screenshots.length]);

	const closeCarousel = useCallback(() => {
		setViewCarousel(false);
	}, []);

	useEffect(() => {
		if (!viewCarousel) return;

		const keysObject: Record<string, () => void> = {
			ArrowLeft: goToPrev,
			ArrowRight: goToNext,
			Escape: closeCarousel,
		};

		const handleKeyboardKey = (event: KeyboardEvent): void => {
			const handler = keysObject[event.key];
			if (!handler) return;
			handler();
		};

		document.addEventListener('keydown', handleKeyboardKey);

		return () => {
			document.removeEventListener('keydown', handleKeyboardKey);
		};
	}, [viewCarousel, goToPrev, goToNext, closeCarousel]);

	const currentScreenshot = screenshots[currentIndex];

	return (
		<>
			<Box
				is='button'
				type='button'
				onClick={() => setViewCarousel(true)}
				aria-label='Open screenshot carousel'
				style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
			>
				<Box is='img' src={screenshots[0]?.accessUrl} alt={screenshots[0]?.altText ?? 'App screenshot'} width='100%' />
			</Box>

			{viewCarousel && currentScreenshot && (
				<Box
					role='dialog'
					aria-modal='true'
					aria-label='Screenshot carousel'
					display='flex'
					flexDirection='column'
					alignItems='center'
					justifyContent='center'
					position='fixed'
					inset={0}
					zIndex={9999}
					backgroundColor='rgba(0,0,0,0.85)'
					onClick={closeCarousel}
				>
					<Box onClick={(e: React.MouseEvent) => e.stopPropagation()} display='flex' flexDirection='column' alignItems='center'>
						<Box
							is='img'
							src={currentScreenshot.accessUrl}
							alt={currentScreenshot.altText ?? `Screenshot ${currentIndex + 1}`}
							maxWidth='90vw'
							maxHeight='80vh'
						/>

						<Box display='flex' alignItems='center' justifyContent='center' marginBlockStart='x16'>
							<ButtonGroup align='center'>
								<Button small onClick={goToPrev} aria-label='Previous screenshot' disabled={screenshots.length <= 1}>
									&#8249;
								</Button>

								<Box is='span' fontScale='p2' color='default' marginInline='x8' aria-live='polite' aria-atomic='true'>
									{currentIndex + 1} / {screenshots.length}
								</Box>

								<Button small onClick={goToNext} aria-label='Next screenshot' disabled={screenshots.length <= 1}>
									&#8250;
								</Button>
							</ButtonGroup>
						</Box>
					</Box>
				</Box>
			)}
		</>
	);
};

export default ScreenshotCarouselAnchor;
