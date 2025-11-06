import { Icon } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { BlockProps } from '../utils/BlockProps';

type IconElementProps = BlockProps<UiKit.IconElement>;

const IconElement = ({ block }: IconElementProps): ReactElement => (
	<Icon size={20} name={block.icon} color={block.variant === 'default' ? 'default' : 'danger'} />
);

export default IconElement;
