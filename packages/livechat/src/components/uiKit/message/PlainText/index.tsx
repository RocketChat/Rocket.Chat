import { Markup } from '@rocket.chat/gazzodown';
import { parse } from '@rocket.chat/message-parser';
import { memo } from 'preact/compat';

import shortnameToUnicode from '../../../Emoji/shortnameToUnicode';
import { createClassName } from '../../../helpers';
import styles from './styles.scss';

const PlainText = ({ text, emoji = false }: { text: string; emoji?: boolean }) => (
	<span className={createClassName(styles, 'uikit-plain-text')} dir='auto'>
		<Markup tokens={parse(shortnameToUnicode(text), { emoticons: emoji })} />
	</span>
);

export default memo(PlainText);
