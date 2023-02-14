import { memo } from 'preact/compat';

import shortnameToUnicode from '../../../Emoji/shortnameToUnicode';
import { createClassName } from '../../../helpers';
import styles from './styles.scss';

const escapeHtml = (unsafe) =>
	unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const PlainText = ({ text, emoji = false }) => (
	<span
		className={createClassName(styles, 'uikit-plain-text')}
		// eslint-disable-next-line react/no-danger
		dangerouslySetInnerHTML={{
			__html: escapeHtml(emoji ? text : shortnameToUnicode(text)).replace(/\n/g, () => '<br/>'),
		}}
		dir='auto'
	/>
);

export default memo(PlainText);
