import katex from 'katex';
import { useMemo } from 'react';

import 'katex/dist/katex.css';

type KatexBlockProps = {
	code: string;
};

const KatexBlock = ({ code }: KatexBlockProps) => {
	const html = useMemo(
		() =>
			katex.renderToString(code, {
				displayMode: true,
				macros: {
					'\\href': '\\@secondoftwo',
				},
				maxSize: 100,
			}),
		[code],
	);

	return <div role='math' style={{ overflowX: 'auto' }} aria-label={code} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default KatexBlock;
