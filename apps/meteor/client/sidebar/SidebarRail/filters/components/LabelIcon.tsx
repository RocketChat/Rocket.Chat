import type { ISubscriptionLabel } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { LABEL_COLOR_TOKENS } from '../lib/labelColors';

type LabelIconProps = Pick<ISubscriptionLabel, 'icon' | 'color'> & Omit<ComponentProps<typeof Icon>, 'name' | 'color'>;

const LabelIcon = ({ icon, color, size = 'x16', ...props }: LabelIconProps) => (
	<Icon name={icon} color={LABEL_COLOR_TOKENS[color]} size={size} aria-hidden {...props} />
);

export default LabelIcon;
