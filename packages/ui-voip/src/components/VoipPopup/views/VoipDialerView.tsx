import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useState, forwardRef, Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { VoipDialPad as DialPad, VoipSettingsButton as SettingsButton } from '../..';
import { useVoipAPI } from '../../../hooks/useVoipAPI';
import type { PositionOffsets } from '../components/VoipPopupContainer';
import Container from '../components/VoipPopupContainer';
import Content from '../components/VoipPopupContent';
import Footer from '../components/VoipPopupFooter';
import Header from '../components/VoipPopupHeader';

type VoipDialerViewProps = {
	position?: PositionOffsets;
	dragHandleRef?: Ref<HTMLElement>;
};

const VoipDialerView = forwardRef<HTMLDivElement, VoipDialerViewProps>(function VoipDialerView({ position, ...props }, ref) {
	const { t } = useTranslation();
	const { makeCall, closeDialer } = useVoipAPI();
	const [number, setNumber] = useState('');

	const handleCall = () => {
		makeCall({ extension: number });
		closeDialer();
	};

	return (
		<Container ref={ref} data-testid='vc-popup-dialer' position={position} {...props}>
			<Header hideSettings onClose={closeDialer}>
				{t('New_Call')}
			</Header>

			<Content>
				<DialPad editable value={number} onChange={(value) => setNumber(value)} />
			</Content>

			<Footer>
				<ButtonGroup large>
					<SettingsButton />
					<Button medium success icon='phone' disabled={!number} flexGrow={1} onClick={handleCall}>
						{t('Call')}
					</Button>
				</ButtonGroup>
			</Footer>
		</Container>
	);
});

export default VoipDialerView;
