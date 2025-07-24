import { Button, ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { PeerInfo, type PeerInfoProps } from '../components';
import { Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent } from '../components/Widget';

const usePeerInfo = (): PeerInfoProps => {
	return {
		name: 'John Doe',
		avatarUrl: '',
		identifier: '4432',
	};
};

const IncomingCall = () => {
	const { t } = useTranslation();

	const peerInfo = usePeerInfo();

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={`${t('Incoming_call')}...`}>
				<IconButton name='customize' icon='customize' small />
			</WidgetHeader>
			<WidgetContent>
				<PeerInfo {...peerInfo} />
			</WidgetContent>
			<WidgetFooter>
				<ButtonGroup stretch>
					<Button medium name='phone' icon='phone-off' danger flexGrow={1}>
						{t('Reject')}
					</Button>
					<Button medium name='phone' icon='phone' success flexGrow={1}>
						{t('Accept')}
					</Button>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default IncomingCall;
