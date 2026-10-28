import type { ReactElement } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Button } from '../Button';
import { Skeleton } from '../Skeleton';

export type CodeSnippetProps = ElementProps<HTMLPreElement> & {
	children: string;
	buttonText?: string;
	buttonDisabled?: boolean;
	onClick?: () => void;
};

/**
 * The `CodeSnippet` is used to show code or commands and make easier to copy them.
 *
 * The default button text is `Copy` but you can use the `buttonText` prop to handle translations in your project.
 *
 * Please check the `useClipBoard` hook in `fuselage-hooks` package, to handle the copy behaviour.
 */
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
