import { memo, lazy, Suspense } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import shortnameToUnicode from '../../../Emoji/shortnameToUnicode';
import styles from './styles.scss';

const Mrkdwn = ({ text /* , verbatim = false */ }: { text: string }) => {
	const { Markup } = lazy(() => import('@rocket.chat/gazzodown'));
	const { parse } = lazy(() => import('@rocket.chat/message-parser'));

	return (
		<div className={createClassName(styles, 'uikit-mrkdwn')} dir='auto'>
			<Suspense fallback={<div>loading...</div>}>
				<Markup tokens={parse(shortnameToUnicode(text), { emoticons: true })} />
			</Suspense>
		</div>
	);
};

export default memo(Mrkdwn);
