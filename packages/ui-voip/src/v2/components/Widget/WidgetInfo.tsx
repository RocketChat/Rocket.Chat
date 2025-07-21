import { Box } from '@rocket.chat/fuselage';

type Slot = {
	text: string;
	type: 'warning' | 'info';
};

type WidgetInfoProps = {
	slots: [Slot, Slot];
};

const WidgetInfo = ({ slots }: WidgetInfoProps) => {
	if (!slots.length) {
		return null;
	}
	return (
		<Box is='span' display='flex' flexDirection='row' justifyContent='space-between' mi={12} mb={4}>
			{slots.map((slot) => (
				<Box color={slot.type === 'warning' ? 'status-font-on-warning' : 'undefined'} fontScale='p2' key={slot.text}>
					{slot.text}
				</Box>
			))}
		</Box>
	);
};

export default WidgetInfo;
