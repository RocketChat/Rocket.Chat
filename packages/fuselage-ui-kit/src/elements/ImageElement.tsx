import * as UiKit from '@rocket.chat/ui-kit';

import { Element } from './ImageElement.styles';
import type { BlockProps } from '../utils/BlockProps';

type ImageElementProps = BlockProps<UiKit.ImageElement>;

const ImageElement = ({ block, context }: ImageElementProps) => {
	const size = (context === UiKit.BlockContext.SECTION && 88) || (context === UiKit.BlockContext.CONTEXT && 20) || undefined;

	if (!size) {
		return null;
	}

	return <Element imageUrl={block.imageUrl} size={size} />;
};

export default ImageElement;
