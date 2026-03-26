import type { ReactElement } from 'react';

type ComposerImageElementProps = {
	src: string;
	alt: string;
};

const imageStyle = {
	maxWidth: '100%',
	maxHeight: '200px',
	verticalAlign: 'middle',
} as const;

const ComposerImageElement = ({ src, alt }: ComposerImageElementProps): ReactElement => <img src={src} alt={alt} style={imageStyle} />;

export default ComposerImageElement;
