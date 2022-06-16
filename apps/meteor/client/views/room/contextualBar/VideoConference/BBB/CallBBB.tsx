import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import VerticalBar from '../../../../../components/VerticalBar';

type CallBBBProps = {
	startCall: () => void;
	endCall: () => void;
	handleClose: () => void;
	canManageCall: boolean;
	live: boolean;
	openNewWindow: boolean;
};

const CallBBB: FC<CallBBBProps> = ({ handleClose, canManageCall, live, startCall, endCall, openNewWindow, ...props }) => {
	const t = useTranslation();
	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='phone' />
				<VerticalBar.Text>{t('Call')}</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent {...(props as any)}>
				{openNewWindow ? (
					<>
						<Box fontScale='p2m'>{t('Video_Conference')}</Box>
						<Box fontScale='p2' color='neutral-700'>
							{t('Opened_in_a_new_window')}
						</Box>
					</>
				) : null}
				<ButtonGroup stretch>
					{live && (
						<Button primary onClick={startCall}>
							{t('BBB_Join_Meeting')}
						</Button>
					)}
					{live && canManageCall && (
						<Button danger onClick={endCall}>
							{t('BBB_End_Meeting')}
						</Button>
					)}
					{!live && canManageCall && (
						<Button primary onClick={startCall}>
							{t('BBB_Start_Meeting')}
						</Button>
					)}
					{!live && !canManageCall && <Button primary>{t('BBB_You_have_no_permission_to_start_a_call')}</Button>}
				</ButtonGroup>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default CallBBB;
