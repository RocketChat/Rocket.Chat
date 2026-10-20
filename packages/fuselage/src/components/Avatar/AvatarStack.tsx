import { createStyledContext, styled, View } from '@tamagui/web';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import { surfaceColors } from '../../Theme';
import { prependClassName } from '../../helpers/prependClassName';
import { toCSSValue } from '../../helpers/toCSSValue';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

/** Tells the avatars a stack renders to overlap. */
export const AvatarStackContext = createStyledContext({ stacked: false });

const AvatarStackFrame = styled(View, {
	context: AvatarStackContext,
	display: 'flex',
	flexDirection: 'row-reverse',
	justifyContent: 'center',
	backgroundColor: toCSSValue('--rcx-avatar-background-color', surfaceColors['surface-light']),

	variants: {
		stacked: { true: {} },
	} as const,
});

export type AvatarStackProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const AvatarStack = ({ children, className, ...props }: AvatarStackProps) => (
	<AvatarStackFrame stacked className={prependClassName(className, 'rcx-avatar-stack')} render={<div {...props} />}>
		{flattenChildren(children).reverse()}
	</AvatarStackFrame>
);

export default withFuselageProvider(AvatarStack);
