import { memo } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import shortnameToUnicode from '../../../Emoji/shortnameToUnicode';
import MarkdownBlock from '../../../MarkdownBlock';
import styles from './styles.scss';

const Mrkdwn = ({ text /* , verbatim = false */ }: { text: string }) => {
	return (
		<div className={createClassName(styles, 'uikit-mrkdwn')} dir='auto'>
			<MarkdownBlock text={shortnameToUnicode(text)} emoticons={true} />
		</div>
	);
};

export default memo(Mrkdwn);
