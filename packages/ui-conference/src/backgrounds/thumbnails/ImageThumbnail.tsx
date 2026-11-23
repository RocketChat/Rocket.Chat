import { Box } from '@rocket.chat/fuselage';

export type ImageThumbnailProps = { url: string };

const ImageThumbnail = ({ url }: ImageThumbnailProps) => <Box is='img' src={url} alt='' width='full' height='full' objectFit='cover' />;

export default ImageThumbnail;
