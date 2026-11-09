import { cx, cxx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { StylingBox } from '../Box';

export type SkeletonProps = ElementProps<HTMLSpanElement> & {
	variant?: 'text' | 'rect' | 'circle';
	/** Whether the placeholder sits on a dark surface, such as a tooltip */
	inverted?: boolean;
	/** The size of the content the placeholder stands in for */
	width?: BoxProps['width'];
	height?: BoxProps['height'];
};

const Skeleton = ({ variant = 'text', inverted, ...props }: SkeletonProps) => (
	<StylingBox {...props}>
		<span
			className={cx(
				cxx('rcx-skeleton')({
					text: variant === 'text',
					rect: variant === 'rect',
					circle: variant === 'circle',
					inverted: !!inverted,
				}),
			)}
		/>
	</StylingBox>
);

export default Skeleton;
