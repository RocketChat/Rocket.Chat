import { styled, Text, View, type GetProps } from '@tamagui/web';
import type { ReactElement } from 'react';

import { surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, fontFamily, size, spacing } from '../../styleTokens';
import { Box, type BoxProps } from '../Box';
import { Button } from '../Button';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Skeleton } from '../Skeleton';

const resetBox = {
	flex: '0 1 auto',
	margin: 0,
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outline: 'none',
	fontVariantNumeric: 'tabular-nums',
} as const;

const CodeSnippetFrame = styled(View, {
	...resetBox,
	render: 'pre',
	fontFamily: fontFamily('sans'),
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	alignItems: 'center',
	width: '100%',
	minHeight: size('x60'),
	padding: spacing('x16'),
	color: String(textIconColors['font-default']),
	borderRadius: toCSSValue('--rcx-code-snippet-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
	backgroundColor: String(surfaceColors['surface-neutral']),
});

const CodeboxFrame = styled(Text, {
	...resetBox,
	render: 'div',
	display: 'block',
	marginRight: spacing('x8'),
	whiteSpace: 'pre-line',
	wordWrap: 'inherit',
	wordBreak: 'break-all',
	fontFamily: 'monospace',
});

export type CodeSnippetProps = BoxProps & {
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
	const frameProps = useTamaguiBoxProps({ 'is': 'pre', 'rcx-code-snippet': true, ...props }) as GetProps<typeof CodeSnippetFrame>;

	if (!children) {
		return (
			<CodeSnippetFrame {...frameProps}>
				<Skeleton width='100%' aria-hidden aria-busy />
			</CodeSnippetFrame>
		);
	}

	return (
		<CodeSnippetFrame {...frameProps}>
			<CodeboxFrame {...({ role: 'code' } as Record<string, unknown>)} className='rcx-code-snippet__codebox'>
				{children}
			</CodeboxFrame>
			{onClick && children && (
				<Box>
					<Button size='small' variant='primary' onClick={onClick} disabled={buttonDisabled}>
						{buttonText}
					</Button>
				</Box>
			)}
		</CodeSnippetFrame>
	);
};

export default withFuselageProvider(CodeSnippet, { takesBoxTransforms: true });
