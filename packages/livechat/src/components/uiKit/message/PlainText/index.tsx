import { memo } from 'preact/compat';

import * as styles from './styles.scss';
import { createClassName } from '../../../../helpers/createClassName';
import shortnameToUnicode from '../../../../lib/emoji/shortnameToUnicode';
import MarkdownBlock from '../../../MarkdownBlock';

const PlainText = ({ text, emoji = false }: { text: string; emoji?: boolean }) => {
	return (
		<span className={createClassName(styles, 'uikit-plain-text')} dir='auto'>
			<MarkdownBlock text={shortnameToUnicode(text)} emoticons={emoji} />
		</span>
	);
};

export default memo(PlainText);
