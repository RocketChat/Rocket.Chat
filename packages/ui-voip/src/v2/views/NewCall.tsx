import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useMediaCallContext, usePeerAutocomplete } from '../MediaCallContext';
import {
	PeerInfo,
	PeerAutocomplete,
	Widget,
	WidgetFooter,
	WidgetHandle,
	WidgetHeader,
	WidgetContent,
	DevicePicker,
	ActionButton,
} from '../components';
import { useKeypad } from '../useKeypad';

const NewCall = () => {
	const { t } = useTranslation();

	const { onKeypadPress, peerInfo, ...autocomplete } = usePeerAutocomplete();

	const { element: keypad, buttonProps: keypadButtonProps } = useKeypad(onKeypadPress);

	const { onCall, onToggleWidget } = useMediaCallContext();

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={t('New_Call')}>
				<ActionButton tiny secondary={false} label='close' icon='cross' onClick={onToggleWidget} />
			</WidgetHeader>
			<WidgetContent>
				<PeerAutocomplete {...autocomplete} />
				{peerInfo && (
					<Box mb={8}>
						<PeerInfo {...peerInfo} />
					</Box>
				)}
			</WidgetContent>
			<WidgetFooter>
				{keypad}
				<ButtonGroup stretch>
					<ActionButton label='dialpad' icon='dialpad' flexGrow={0} secondary {...keypadButtonProps} />
					<DevicePicker secondary />
					<Button
						medium
						name='phone'
						icon='phone'
						success
						flexGrow={1}
						onClick={() => {
							if (!peerInfo) {
								return;
							}

							if ('userId' in peerInfo) {
								onCall(peerInfo.userId, 'user');
								return;
							}

							if ('number' in peerInfo) {
								onCall(peerInfo.number, 'sip');
								return;
							}

							throw new Error('MediaCall - New call - something went wrong when trying to call. PeerInfo is missing userId and/or number.');
						}}
					>
						{t('Call')}
					</Button>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default NewCall;
