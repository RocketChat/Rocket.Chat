import katex from 'katex';
import { ReactElement, useMemo } from 'react';

import 'katex/dist/katex.css';

type KatexBlockProps = {
	code: string;
};

const KatexBlock = ({ code }: KatexBlockProps): ReactElement => {
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
