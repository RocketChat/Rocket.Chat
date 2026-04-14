import { Icon, FramedIcon } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ComponentProps, ReactElement } from 'react';

import type { BlockProps } from '../utils/BlockProps';

type IconElementProps = BlockProps<UiKit.FrameableIconElement>;

const getVariantColor = (variant: UiKit.FrameableIconElement['variant']): string => {
	switch (variant) {
		case 'danger':
			return 'danger';
		case 'secondary':
			return 'secondary-info';
		case 'warning':
			return 'status-font-on-warning';
		case 'default':
		default:
			return 'default';
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

const IconElement = ({ block }: IconElementProps): ReactElement => {
	const { icon, variant, framed } = block;
	if (framed) {
		return <FramedIcon size={20} icon={icon} {...getFramedIconProps(variant)} />;
	}
	return <Icon size={20} name={icon} color={getVariantColor(variant)} />;
};

export default IconElement;
