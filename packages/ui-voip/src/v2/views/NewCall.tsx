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

const NewCall = () => {
	const { t } = useTranslation();

	const { peerInfo, ...autocomplete } = usePeerAutocomplete();

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
				<ButtonGroup stretch>
					<DevicePicker secondary />
					<Button medium name='phone' icon='phone' success flexGrow={1} onClick={onCall}>
						{t('Call')}
					</Button>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default NewCall;
