import { Box } from '../Box';
import { Icon, type IconProps } from '../Icon';

export type LabelInfoProps = {
	/** The explanation, shown as the icon's tooltip. */
	title: string;
	/** Point the input's `aria-describedby` at it, so assistive technology reads the explanation too. */
	id?: string;
} & Omit<IconProps, 'name'>;

/**
 * An info icon in a label, explaining the field in a tooltip.
 */
export const LabelInfo = ({ title, id, ...props }: LabelInfoProps) => (
	<Box is='span' marginInline='x4' rcx-label__info>
		<span hidden id={id}>
			{title}
		</span>
		<Icon {...props} name='info-circled' title={title} />
	</Box>
);
