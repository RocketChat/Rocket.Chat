import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';

import { useHighlightedCode } from '../../../hooks/useHighlightedCode';

export const CodeDisplay = ({ code, language = 'javascript' }: { code: string; language?: string }) => {
	const highlightedCode = useHighlightedCode(language, code);
	return (
		<Box fontScale='p2' withRichContent flexGrow={1}>
			<code aria-label='code_setting' dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(highlightedCode) }}></code>
		</Box>
	);
};
