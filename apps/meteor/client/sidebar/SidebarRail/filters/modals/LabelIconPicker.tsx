import type { SubscriptionLabelColor, SubscriptionLabelIcon } from '@rocket.chat/core-typings';
import { SUBSCRIPTION_LABEL_ICONS } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';

import { LABEL_COLOR_TOKENS } from '../lib/labelColors';

type LabelIconPickerProps = {
	'value': SubscriptionLabelIcon;
	'color': SubscriptionLabelColor;
	'onChange': (icon: SubscriptionLabelIcon) => void;
	'aria-labelledby'?: string;
};

const LabelIconPicker = ({ value, color, onChange, 'aria-labelledby': ariaLabelledBy }: LabelIconPickerProps) => (
	<Box role='radiogroup' aria-labelledby={ariaLabelledBy} display='flex' flexWrap='wrap' gap={4}>
		{SUBSCRIPTION_LABEL_ICONS.map((icon) => (
			<IconButton
				key={icon}
				role='radio'
				aria-checked={value === icon}
				aria-label={icon}
				icon={icon}
				small
				pressed={value === icon}
				color={LABEL_COLOR_TOKENS[color]}
				onClick={() => onChange(icon)}
			/>
		))}
	</Box>
);

export default LabelIconPicker;
