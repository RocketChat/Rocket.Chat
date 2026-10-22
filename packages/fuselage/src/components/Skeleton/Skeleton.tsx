import type { AllHTMLAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';
import type { BoxProps, StylingBoxProps } from '../Box';
import { StylingBox } from '../Box';

export type SkeletonProps = Omit<StylingBoxProps, 'children'> & {
	variant?: 'text' | 'rect' | 'circle';
	/** The size of the content the placeholder stands in for */
	width?: BoxProps['width'];
	height?: BoxProps['height'];
} & AllHTMLAttributes<HTMLSpanElement>;

const Skeleton = ({ variant = 'text', ...props }: SkeletonProps) => (
	<StylingBox {...props}>
		<span
			className={cx(
				cxx('rcx-skeleton')({
					text: variant === 'text',
					rect: variant === 'rect',
					circle: variant === 'circle',
				}),
			)}
		/>
	</StylingBox>
);

export default Skeleton;
