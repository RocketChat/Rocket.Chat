import { memo } from 'preact/compat';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../../helpers/createClassName';
import isBigEmoji from '../../../lib/emoji/isBigEmoji';
import shortnameToUnicode from '../../../lib/emoji/shortnameToUnicode';
import MarkdownBlock from '../../MarkdownBlock';
import styles from './styles.scss';

type MessageTextProps = {
	text: string;
	system?: boolean;
	className?: string;
	style?: JSXInternal.CSSProperties;
};
export const MessageText = memo(({ text, system, className, style = {} }: MessageTextProps) => {
	const bigEmoji = isBigEmoji(text);

	return (
		<div className={createClassName(styles, 'message-text', { system, bigEmoji }, [className])} style={style}>
			<MarkdownBlock text={shortnameToUnicode(text)} emoticons={true} />
		</div>
	);
});
