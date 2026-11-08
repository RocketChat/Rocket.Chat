import type { ReactElement } from 'react';

type ComposerCodeElementProps = {
	code: string;
};

const ComposerCodeElement = ({ code }: ComposerCodeElementProps): ReactElement => (
	<>
		`<code className='code-colors inline'>{code}</code>`
	</>
);

export default ComposerCodeElement;
