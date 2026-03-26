import type { ReactElement } from 'react';

type ComposerCodeElementProps = {
	code: string;
};

const codeStyle = {
	fontFamily: 'var(--rcx-font-family-mono, monospace)',
	backgroundColor: 'var(--rcx-color-surface-tint, rgba(0, 0, 0, 0.05))',
	borderRadius: '3px',
	padding: '0 4px',
} as const;

const ComposerCodeElement = ({ code }: ComposerCodeElementProps): ReactElement => (
	<>
		`<code style={codeStyle}>{code}</code>`
	</>
);

export default ComposerCodeElement;
