import type { SubscriptionLabelColor } from '@rocket.chat/core-typings';
import { SUBSCRIPTION_LABEL_COLORS } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { LABEL_COLOR_NAMES, LABEL_COLOR_TOKENS } from '../lib/labelColors';

type LabelColorPickerProps = {
	'value': SubscriptionLabelColor;
	'onChange': (color: SubscriptionLabelColor) => void;
	'aria-labelledby'?: string;
};

const LabelColorPicker = ({ value, onChange, 'aria-labelledby': ariaLabelledBy }: LabelColorPickerProps) => {
	const { t } = useTranslation();

	return (
		<Box role='radiogroup' aria-labelledby={ariaLabelledBy} display='flex' gap={4}>
			{SUBSCRIPTION_LABEL_COLORS.map((color) => (
				<IconButton
					key={color}
					role='radio'
					aria-checked={value === color}
					aria-label={t(LABEL_COLOR_NAMES[color])}
					title={t(LABEL_COLOR_NAMES[color])}
					icon={value === color ? 'circle-check' : 'circle'}
					small
					pressed={value === color}
					color={LABEL_COLOR_TOKENS[color]}
					onClick={() => onChange(color)}
				/>
			))}
		</Box>
	);
};

export default LabelColorPicker;
