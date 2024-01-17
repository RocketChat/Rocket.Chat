import katex from 'katex';
import { ReactElement, useMemo } from 'react';

import 'katex/dist/katex.css';

type KatexElementProps = {
	code: string;
};

const KatexElement = ({ code }: KatexElementProps): ReactElement => {
	const html = useMemo(
		() =>
			katex.renderToString(code, {
				displayMode: false,
				macros: {
					'\\href': '\\@secondoftwo',
				},
			}),
		[code],
	);

	return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default KatexElement;
