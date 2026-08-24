import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

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
} from '../../components';
import { usePeerAutocomplete } from '../../context';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import { useWidgetExternalControls } from '../../context/useWidgetExternalControls';

const NewCall = () => {
	const { t } = useTranslation();

	const { onCall, onSelectPeer, targetPeer } = useMediaCallView();
	const { toggleWidget } = useWidgetExternalControls();

	const autocomplete = usePeerAutocomplete(onSelectPeer, targetPeer);

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={t('New_call')}>
				<ActionButton tiny secondary={false} label={t('Close')} icon='cross' onClick={() => toggleWidget()} />
			</WidgetHeader>
			<WidgetContent>
				<PeerAutocomplete {...autocomplete} />
				{targetPeer && (
					<Box marginBlock={8}>
						<PeerInfo {...targetPeer} />
					</Box>
				)}
			</WidgetContent>
			<WidgetFooter>
				<ButtonGroup stretch>
					<DevicePicker secondary />
					<Button medium icon='phone' success flexGrow={1} onClick={onCall}>
						{t('Call')}
					</Button>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default NewCall;
