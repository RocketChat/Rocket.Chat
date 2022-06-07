import React, { ReactElement } from 'react';

import PlainSpan from './PlainSpan';

type CodeElementProps = {
	code: string;
};

const CodeElement = ({ code }: CodeElementProps): ReactElement => (
	<code className='code-colors inline'>
		<PlainSpan text={code} />
	</code>
);

export default CodeElement;
