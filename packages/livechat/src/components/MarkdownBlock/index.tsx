import { parse } from '@rocket.chat/message-parser';
import { Suspense, lazy } from 'preact/compat';

const Markup = lazy(() => import('@rocket.chat/gazzodown/dist/Markup'));

export type MarkdownBlockProps = { text: string; emoticons?: boolean };

const MarkdownBlock = ({ text, emoticons }: MarkdownBlockProps) => {
	return (
		<Suspense fallback={<div>loading...</div>}>
			<Markup tokens={parse(text, { emoticons })} />
		</Suspense>
	);
};

export default MarkdownBlock;
