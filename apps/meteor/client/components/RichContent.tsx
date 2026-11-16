import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type RichContentProps = {
	children?: ReactNode;
	dangerouslySetInnerHTML?: { __html: string };
};

/**
 * A block of formatted text, its headings, paragraphs, lists, links and code set in the rich text styles.
 */
const RichContent = ({ children, dangerouslySetInnerHTML }: RichContentProps) => (
	<Box withRichContent dangerouslySetInnerHTML={dangerouslySetInnerHTML}>
		{children}
	</Box>
);

export default RichContent;
