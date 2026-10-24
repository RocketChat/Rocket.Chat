import { styled, View, type GetProps } from '@tamagui/web';

import { strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, fontFamily, fontScale, size, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Skeleton } from '../Skeleton';

const InputBoxSkeletonFrame = styled(View, {
	display: 'inline-flex',
	flexDirection: 'row',
	flexGrow: 1,
	flexShrink: 0,
	flexBasis: 0,
	minWidth: size('x128'),
	minHeight: size('x40'),
	paddingBlock: `calc(${spacing('x12')} - ${borderWidth('default')})`,
	paddingInline: `calc(${spacing('x16')} - ${borderWidth('default')})`,
	verticalAlign: 'baseline',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	outline: 'none',
	color: toCSSValue('--rcx-input-colors-color', textIconColors['font-titles-labels']),
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: toCSSValue('--rcx-input-colors-border-color', strokeColors['stroke-light']),
	borderRadius: toCSSValue('--rcx-input-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
	backgroundColor: toCSSValue('--rcx-input-colors-background-color', surfaceColors['surface-light']),
	fontFamily: fontFamily('sans'),
	...fontScale('p2m'),
});

export type InputBoxSkeletonProps = ElementProps<HTMLDivElement>;

const InputBoxSkeleton = ({ className, ...props }: InputBoxSkeletonProps) => (
	<InputBoxSkeletonFrame
		className={['rcx-skeleton__input', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof InputBoxSkeletonFrame>)}
	>
		<Skeleton width='100%' />
	</InputBoxSkeletonFrame>
);

export default withFuselageProvider(InputBoxSkeleton);
