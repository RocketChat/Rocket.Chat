import { memo } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../../../helpers/createClassName';
import shortnameToUnicode from '../../../../lib/emoji/shortnameToUnicode';
import MarkdownBlock from '../../../MarkdownBlock';

export type MrkdwnProps = { text: string };

const Mrkdwn = ({ text /* , verbatim = false */ }: MrkdwnProps) => {
	return (
		<div className={createClassName(styles, 'uikit-mrkdwn')} dir='auto'>
			<MarkdownBlock text={shortnameToUnicode(text)} emoticons={true} />
		</div>
	);
};

export default memo(Mrkdwn);
