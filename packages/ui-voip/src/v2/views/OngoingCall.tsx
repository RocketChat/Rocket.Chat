import { ButtonGroup } from '@rocket.chat/fuselage';

import { useMediaCallContext } from '../MediaCallContext';
import {
	ToggleButton,
	PeerInfo,
	Widget,
	WidgetFooter,
	WidgetHandle,
	WidgetHeader,
	WidgetContent,
	WidgetInfo,
	Timer,
	DevicePicker,
	ActionButton,
} from '../components';
import { useInfoSlots } from '../useInfoSlots';
import { useKeypad } from '../useKeypad';

const OngoingCall = () => {
	const { muted, held, onMute, onHold, onForward, onEndCall, onTone, peerInfo } = useMediaCallContext();

	const keypad = useKeypad(onTone);

	const slots = useInfoSlots(muted, held);

	// TODO: Figure out how to ensure this always exist before rendering the component
	if (!peerInfo) {
		throw new Error('Peer info is required');
	}

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={<Timer />}>
				<DevicePicker />
			</WidgetHeader>
			<WidgetInfo slots={slots} />
			<WidgetContent>
				<PeerInfo {...peerInfo} />
			</WidgetContent>
			<WidgetFooter>
				{keypad?.element}
				<ButtonGroup large>
					<ActionButton label='dialpad' icon='dialpad' onClick={keypad.toggleOpen} />
					<ToggleButton label='mute' icons={['mic', 'mic-off']} pressed={muted} onToggle={onMute} />
					<ToggleButton label='hold' icons={['pause-shape-unfilled', 'pause-shape-unfilled']} pressed={held} onToggle={onHold} />
					<ActionButton label='forward' icon='arrow-forward' onClick={onForward} />
					<ActionButton label='phone' icon='phone' danger onClick={onEndCall} />
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default OngoingCall;
