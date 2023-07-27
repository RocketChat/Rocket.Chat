import { Markup } from '@rocket.chat/gazzodown';
import { parse } from '@rocket.chat/message-parser';
import { memo } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import shortnameToUnicode from '../../../Emoji/shortnameToUnicode';
import styles from './styles.scss';

const Mrkdwn = ({ text /* , verbatim = false */ }: { text: string }) => {
	return (
		<div className={createClassName(styles, 'uikit-mrkdwn')} dir='auto'>
			<Markup tokens={parse(shortnameToUnicode(text), { emoticons: true })} />
		</div>
	);
};

export default memo(Mrkdwn);
