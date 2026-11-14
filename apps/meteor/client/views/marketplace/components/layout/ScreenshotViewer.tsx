import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type ScreenshotViewerProps = {
	previous?: ReactNode;
	next?: ReactNode;
	onClose: () => void;
	children: ReactNode;
};

/**
 * The full-screen screenshot viewer: a dimmed backdrop, the slides centred on it, and the previous and next controls at its edges.
 */
const ScreenshotViewer = ({ previous, next, onClose, children }: ScreenshotViewerProps) => (
	<>
		<Box position='fixed' width='100%' height='100vh' backgroundColor='font-pure-black' opacity='0.7' marginBlock='0' zIndex='2' />

		{previous && (
			<Box position='absolute' zIndex={3} style={{ top: '50%', left: '10px', transform: 'translateY(-50%)' }}>
				{previous}
			</Box>
		)}

		{next && (
			<Box position='absolute' zIndex={3} style={{ top: '50%', right: '10px', transform: 'translateY(-50%)' }}>
				{next}
			</Box>
		)}

		<Box
			onClick={onClose}
			position='fixed'
			width='100%'
			height='100vh'
			display='flex'
			justifyContent='center'
			alignItems='center'
			zIndex='2'
			marginInline='x40'
		>
			{children}
		</Box>
	</>
);

export default ScreenshotViewer;
