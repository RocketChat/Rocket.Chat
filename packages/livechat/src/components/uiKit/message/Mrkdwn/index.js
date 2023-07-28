import { memo } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import renderEmojis from '../../../Messages/MessageText/emoji';
import { renderMarkdown } from '../../../Messages/MessageText/markdown';
import styles from './styles.scss';

const Mrkdwn = ({ text /* , verbatim = false */ }) => (
	<div
		className={createClassName(styles, 'uikit-mrkdwn')}
		// eslint-disable-next-line react/no-danger
		dangerouslySetInnerHTML={{ __html: renderEmojis(renderMarkdown(text)) }}
		dir='auto'
	/>
);

export default memo(Mrkdwn);
