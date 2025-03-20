import * as uikit from '@rocket.chat/ui-kit';
import { memo } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import styles from './styles.scss';

type ImageElementProps = uikit.ImageElement & {
	context: uikit.BlockContext;
};

const ImageElement = ({ imageUrl, altText, context }: ImageElementProps) => (
	<div
		aria-label={altText}
		className={createClassName(styles, 'uikit-image', {
			accessory: context === uikit.BlockContext.SECTION,
			context: context === uikit.BlockContext.CONTEXT,
		})}
		role='img'
		style={{
			backgroundImage: `url(${imageUrl})`,
		}}
		title={altText}
	/>
);

export default memo(ImageElement);
