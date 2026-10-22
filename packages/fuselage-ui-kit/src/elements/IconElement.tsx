import { Icon, FramedIcon, StatusIcon, type StatusIconProps } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ComponentProps } from 'react';

import type { BlockProps } from '../utils/BlockProps';

export type IconElementProps = BlockProps<UiKit.FrameableIconElement>;

const getVariantStatus = (variant: UiKit.FrameableIconElement['variant']): StatusIconProps['status'] | undefined => {
	switch (variant) {
		case 'danger':
			return 'danger';
		case 'secondary':
			return 'hint';
		case 'warning':
			return 'warning';
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
	const status = getVariantStatus(variant);
	return status ? <StatusIcon size={20} name={icon} status={status} /> : <Icon size={20} name={icon} />;
};

export default IconElement;
