import { Box } from '@rocket.chat/fuselage';

type ScreenshotSlideProps = {
	current: boolean;
	src: string;
	alt: string;
};

const currentStyle = { opacity: '1', transitionDuration: '1s', transform: 'scale(1.08)' };
const hiddenStyle = { opacity: '0', transitionDuration: '1s ease' };

/**
 * One slide of the screenshot viewer, faded in and showing its image only while it is the current one.
 */
const ScreenshotSlide = ({ current, src, alt }: ScreenshotSlideProps) => (
	<Box style={current ? currentStyle : hiddenStyle}>
		{current && <Box is='img' src={src} alt={alt} maxWidth='x1200' maxHeight='x600' width='100%' height='100%' />}
	</Box>
);

export default ScreenshotSlide;
