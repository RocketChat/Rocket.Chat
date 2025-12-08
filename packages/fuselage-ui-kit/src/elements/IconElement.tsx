import { Icon } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import type { BlockProps } from '../utils/BlockProps';

type IconElementProps = BlockProps<UiKit.IconElement>;

const getVariantColor = (variant: UiKit.IconElement['variant']): string => {
	switch (variant) {
		case 'default':
			return 'default';
		case 'danger':
			return 'danger';
		case 'secondary':
			return 'secondary-info';
	}
};

const IconElement = ({ block }: IconElementProps): ReactElement => (
	<Icon size={20} name={block.icon} color={getVariantColor(block.variant)} />
);

export default IconElement;
