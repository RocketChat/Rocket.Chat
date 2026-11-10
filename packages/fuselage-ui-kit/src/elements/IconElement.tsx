import { Icon, FramedIcon, type IconColor } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ComponentProps } from 'react';

import type { BlockProps } from '../utils/BlockProps';

export type IconElementProps = BlockProps<UiKit.FrameableIconElement>;

const getVariantColor = (variant: UiKit.FrameableIconElement['variant']): IconColor | undefined => {
	switch (variant) {
		case 'danger':
			return 'danger';
		case 'secondary':
			return 'hint';
		case 'warning':
			return 'status-font-on-warning';
		case 'default':
		default:
			return undefined;
	}
};

const getFramedIconProps = (
	variant: UiKit.FrameableIconElement['variant'],
): Pick<ComponentProps<typeof FramedIcon>, 'warning' | 'danger' | 'neutral'> => {
	switch (variant) {
		case 'danger':
			return { danger: true };
		case 'warning':
			return { warning: true };
		case 'default':
		case 'secondary':
		default:
			return { neutral: true };
	}
};

const IconElement = ({ block }: IconElementProps) => {
	const { icon, variant, framed } = block;
	if (framed) {
		return <FramedIcon icon={icon} {...getFramedIconProps(variant)} />;
	}
	return <Icon size={20} name={icon} color={getVariantColor(variant)} />;
};

export default IconElement;
