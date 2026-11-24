import { Box } from '@rocket.chat/fuselage';

export type LayoutLogoImageProps = {
	src: string;
	alt: string;
};

const LayoutLogoImage = ({ src, alt }: LayoutLogoImageProps) => <Box is='img' maxHeight='x40' marginInline='neg-x8' src={src} alt={alt} />;

export default LayoutLogoImage;
