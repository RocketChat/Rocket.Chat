import { BlockContext } from '@rocket.chat/ui-kit';
import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers';
import styles from './styles.scss';

const ImageElement = ({ imageUrl, altText, context }) => (
	<div
		aria-label={altText}
		className={createClassName(styles, 'uikit-image', {
			accessory: context === BlockContext.SECTION,
			context: context === BlockContext.CONTEXT,
		})}
		role='img'
		style={{
			backgroundImage: `url(${imageUrl})`,
		}}
		title={altText}
	/>
);

export default memo(ImageElement);
