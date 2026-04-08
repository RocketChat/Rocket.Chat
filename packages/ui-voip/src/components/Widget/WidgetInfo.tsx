import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconNames } from '@rocket.chat/icons';

type Slot = {
	text: string;
	type: 'warning' | 'info';
	icon?: IconNames;
};

type WidgetInfoProps = {
	slots?: Slot[];
	variant?: 'default' | 'card-content';
};

const WidgetInfo = ({ slots, variant = 'default' }: WidgetInfoProps) => {
	if (!slots?.length) {
		return null;
	}
	return (
		<Box
			is='span'
			display='flex'
			flexDirection='row'
			justifyContent={variant === 'card-content' ? 'center' : 'space-between'}
			mi={12}
			mbs={4}
			mbe={variant === 'card-content' ? 0 : 4}
		>
			{slots.map((slot) => (
				<Box
					is='span'
					color={slot.type === 'warning' ? 'status-font-on-warning' : undefined}
					fontScale={variant === 'card-content' ? 'c1' : 'p2'}
					key={slot.text}
				>
					{slot.icon && <Icon name={slot.icon} mbe={4} />} {slot.text}
				</Box>
			))}
		</Box>
	);
};

export default WidgetInfo;
