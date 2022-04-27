import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers';
import styles from './styles.scss';

const ImageElement = ({ imageUrl, altText, context }) =>
	<div
		aria-label={altText}
		className={createClassName(styles, 'uikit-image', {
			accessory: context === BLOCK_CONTEXT.SECTION,
			context: context === BLOCK_CONTEXT.CONTEXT,
		})}
		role='img'
		style={{
			backgroundImage: `url(${ imageUrl })`,
		}}
		title={altText}
	/>;

export default memo(ImageElement);
