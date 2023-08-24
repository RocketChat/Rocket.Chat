import { memo } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import shortnameToUnicode from '../../../Emoji/shortnameToUnicode';
import MarkdownBlock from '../../../MarkdownBlock';
import styles from './styles.scss';

const PlainText = ({ text, emoji = false }: { text: string; emoji?: boolean }) => {
	return (
		<span className={createClassName(styles, 'uikit-plain-text')} dir='auto'>
			<MarkdownBlock text={shortnameToUnicode(text)} emoticons={emoji} />
		</span>
	);
};

export default memo(PlainText);
