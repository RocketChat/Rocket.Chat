import { parse } from '@rocket.chat/message-parser';
import { Suspense } from 'preact/compat';

import Markup from './Markup';

export type MarkdownBlockProps = { text: string; emoticons?: boolean };

const MarkdownBlock = ({ text, emoticons }: MarkdownBlockProps) => {
	return (
		<Suspense fallback={<div>loading...</div>}>
			<Markup tokens={parse(text, { emoticons })} />
		</Suspense>
	);
};

export default MarkdownBlock;
