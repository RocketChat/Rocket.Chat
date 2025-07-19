import { memo } from 'preact/compat';

import * as styles from './styles.scss';
import { createClassName } from '../../../../helpers/createClassName';
import shortnameToUnicode from '../../../../lib/emoji/shortnameToUnicode';
import MarkdownBlock from '../../../MarkdownBlock';

const Mrkdwn = ({ text /* , verbatim = false */ }: { text: string }) => {
	return (
		<div className={createClassName(styles, 'uikit-mrkdwn')} dir='auto'>
			<MarkdownBlock text={shortnameToUnicode(text)} emoticons={true} />
		</div>
	);
};

export default memo(Mrkdwn);
