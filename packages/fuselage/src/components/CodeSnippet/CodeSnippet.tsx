import type { ReactElement } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Button } from '../Button';
import { Skeleton } from '../Skeleton';

export type CodeSnippetProps = ElementProps<HTMLPreElement> & {
	/** The code or command to show; while it is empty, a loading skeleton takes its place. */
	children: string;
	/** Label of the copy button, to translate the default `Copy`. */
	buttonText?: string;
	buttonDisabled?: boolean;
	/**
	 * Called when the copy button is pressed; without it, there is no button. Copy with `useClipboard` from
	 * `@rocket.chat/fuselage-hooks`.
	 */
	onClick?: () => void;
};

/** Shows code or a command in a monospaced block, with an optional button to copy it. */
const CodeSnippet = ({
	children,
	onClick,
	buttonText = 'Copy',
	buttonDisabled = false,
	...props
}: CodeSnippetProps): ReactElement<CodeSnippetProps> => {
	if (!children) {
		return (
			<Box is='pre' rcx-code-snippet {...props}>
				<Skeleton width='100%' aria-hidden aria-busy />
			</Box>
		);
	}

	return (
		<Box is='pre' rcx-code-snippet {...props}>
			<Box role='code' rcx-code-snippet__codebox>
				{children}
			</Box>
			{onClick && children && (
				<Box>
					<Button size='small' variant='primary' onClick={onClick} disabled={buttonDisabled}>
						{buttonText}
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default CodeSnippet;
