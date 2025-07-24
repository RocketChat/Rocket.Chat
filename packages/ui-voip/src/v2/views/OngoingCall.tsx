import { ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { useState } from 'react';
// import { useTranslation } from 'react-i18next';

import { ActionButton, PeerInfo, type PeerInfoProps } from '../components';
import Timer from '../components/Timer';
import { Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent, WidgetInfo } from '../components/Widget';
import { useInfoSlots } from '../useInfoSlots';

const usePeerInfo = (): PeerInfoProps => {
	return {
		name: 'John Doe',
		avatarUrl: '',
		identifier: '4432',
	};
};

const OngoingCall = () => {
	const peerInfo = usePeerInfo();

	const [muted, setMuted] = useState(false);
	const [held, setHeld] = useState(false);

	const slots = useInfoSlots(muted, held);

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={<Timer />}>
				<IconButton name='customize' icon='customize' small />
			</WidgetHeader>
			<WidgetInfo slots={slots} />

			<WidgetContent>
				<PeerInfo {...peerInfo} />
			</WidgetContent>
			<WidgetFooter>
				<ButtonGroup large>
					<ActionButton label='dialpad' icon='dialpad' />
					<ActionButton label='forward' icon='arrow-forward' />
					<ActionButton label='hold' icon='pause-shape-unfilled' onClick={() => setHeld((held) => !held)} pressed={held} />
					<ActionButton label='mute' icon='mic' pressedIcon='mic-off' onClick={() => setMuted(!muted)} pressed={muted} />
					<ActionButton label='phone' icon='phone' danger />
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default OngoingCall;
