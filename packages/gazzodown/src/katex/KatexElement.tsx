import katex from 'katex';
import { useMemo } from 'react';

import 'katex/dist/katex.css';

type KatexElementProps = {
	code: string;
};

const KatexElement = ({ code }: KatexElementProps) => {
	const html = useMemo(
		() =>
			katex.renderToString(code, {
				displayMode: false,
				macros: {
					'\\href': '\\@secondoftwo',
				},
				maxSize: 100,
			}),
		[code],
	);

	return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default KatexElement;
