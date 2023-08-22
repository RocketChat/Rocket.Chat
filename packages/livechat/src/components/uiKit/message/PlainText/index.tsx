import { Suspense, lazy, memo } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import shortnameToUnicode from '../../../Emoji/shortnameToUnicode';
import styles from './styles.scss';

const PlainText = ({ text, emoji = false }: { text: string; emoji?: boolean }) => {
	const { Markup } = lazy(() => import('@rocket.chat/gazzodown'));
	const { parse } = lazy(() => import('@rocket.chat/message-parser'));
	return (
		<span className={createClassName(styles, 'uikit-plain-text')} dir='auto'>
			<Suspense fallback={<div>loading...</div>}>
				<Markup tokens={parse(shortnameToUnicode(text), { emoticons: emoji })} />
			</Suspense>
		</span>
	);
};

export default memo(PlainText);
