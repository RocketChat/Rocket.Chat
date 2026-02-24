import { parse } from '@rocket.chat/message-parser';
import { Suspense, lazy } from 'preact/compat';

const Markup = lazy(() => import('@rocket.chat/gazzodown/dist/Markup'));

const MarkdownBlock = ({ text, emoticons }: { text: string; emoticons?: boolean }) => {
	return (
		<Suspense fallback={<div>loading...</div>}>
			<Markup tokens={parse(text, { emoticons })} />
		</Suspense>
	);
};

export default MarkdownBlock;
