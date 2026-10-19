import { styled, View } from '@tamagui/web';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import { surfaceColors } from '../../Theme';
import { prependClassName } from '../../helpers/prependClassName';
import { toCSSValue } from '../../helpers/toCSSValue';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const AvatarStackFrame = styled(View, {
	display: 'flex',
	flexDirection: 'row-reverse',
	justifyContent: 'center',
	backgroundColor: toCSSValue('--rcx-avatar-background-color', surfaceColors['surface-light']),
});

export type AvatarStackProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const AvatarStack = ({ children, className, ...props }: AvatarStackProps) => (
	<AvatarStackFrame className={prependClassName(className, 'rcx-avatar-stack')} render={<div {...props} />}>
		{flattenChildren(children).reverse()}
	</AvatarStackFrame>
);

export default withFuselageProvider(AvatarStack);
