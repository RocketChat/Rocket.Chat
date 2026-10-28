import { memo } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../../../helpers/createClassName';
import shortnameToUnicode from '../../../../lib/emoji/shortnameToUnicode';
import MarkdownBlock from '../../../MarkdownBlock';

export type PlainTextProps = { text: string; emoji?: boolean };

const PlainText = ({ text, emoji = false }: PlainTextProps) => {
	return (
		<span className={createClassName(styles, 'uikit-plain-text')} dir='auto'>
			<MarkdownBlock text={shortnameToUnicode(text)} emoticons={emoji} />
		</span>
	);
};

export default memo(PlainText);
