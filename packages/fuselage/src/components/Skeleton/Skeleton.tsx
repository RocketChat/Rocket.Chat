import { cx, cxx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { StylingBox } from '../Box';

export type SkeletonProps = ElementProps<HTMLSpanElement> & {
	/** `text` is as tall as a line of the surrounding text; `rect` and `circle` are as tall as `height`. */
	variant?: 'text' | 'rect' | 'circle';
	/** For a placeholder on a dark surface, such as a tooltip. */
	inverted?: boolean;
	/** Width of the content the placeholder stands in for; it fills the available width by default. */
	width?: BoxProps['width'];
	/** Height of the content the placeholder stands in for. */
	height?: BoxProps['height'];
};

/**
 * Holds the place of content that is still loading, in its shape and size, so the layout doesn't shift when it arrives.
 */
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
