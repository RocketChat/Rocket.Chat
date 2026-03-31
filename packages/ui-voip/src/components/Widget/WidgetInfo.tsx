import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconNames } from '@rocket.chat/icons';

type Slot = {
	text: string;
	type: 'warning' | 'info';
	icon?: IconNames;
};

type WidgetInfoProps = {
	slots?: Slot[];
};

const WidgetInfo = ({ slots }: WidgetInfoProps) => {
	if (!slots?.length) {
		return null;
	}
	return (
		<Box is='span' display='flex' flexDirection='row' justifyContent='space-between' mi={12} mb={4}>
			{slots.map((slot) => (
				<Box color={slot.type === 'warning' ? 'status-font-on-warning' : undefined} fontScale='p2' key={slot.text}>
					{slot.icon && <Icon name={slot.icon} mbe={4} />} {slot.text}
				</Box>
			))}
		</Box>
	);
};

export default WidgetInfo;
