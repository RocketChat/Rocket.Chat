import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';

/** @deprecated */
const RawText = ({ children }: { children: string }): ReactElement => (
	<span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(children) }} />
);

export default RawText;
