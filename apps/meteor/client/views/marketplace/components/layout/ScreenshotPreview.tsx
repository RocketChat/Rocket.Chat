import { Box } from '@rocket.chat/fuselage';
import type { KeyboardEvent, ReactNode } from 'react';

type ScreenshotPreviewProps = {
	src?: string;
	alt: string;
	onClick: () => void;
	children: ReactNode;
};

/**
 * The screenshot shown on an app's details, with a caption bar below it, that opens the image gallery.
 */
const ScreenshotPreview = ({ src, alt, onClick, children }: ScreenshotPreviewProps) => {
	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		onClick();
	};

	return (
		<Box
			role='button'
			onClick={onClick}
			onKeyDown={handleKeyDown}
			display='flex'
			flexDirection='column'
			maxWidth='x640'
			width='100%'
			style={{
				cursor: 'pointer',
			}}
			tabIndex={0}
		>
			<Box is='img' src={src} alt={alt} />

			<Box display='flex' flexDirection='row' backgroundColor='tint' paddingInline='x16' paddingBlock='x8' alignItems='center' gap='x8'>
				{children}
			</Box>
		</Box>
	);
};

export default ScreenshotPreview;
