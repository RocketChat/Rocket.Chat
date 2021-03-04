import React, { FC, useEffect } from 'react';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import VerticalBar from '../../../../../components/VerticalBar';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import { useSetting } from '../../../../../contexts/SettingsContext';
import { useRoom } from '../../../providers/RoomProvider';
import { usePermission } from '../../../../../contexts/AuthorizationContext';
import { IRoom } from '../../../../../../definition/IRoom';
import { useMethod } from '../../../../../contexts/ServerContext';
import { popout } from '../../../../../../app/ui-utils/client';


export const CallBBB: FC <{
	startCall: () => void;
	endCall: () => void;
	handleClose: () => void;
	canManageCall: boolean;
	live: boolean;
	openNewWindow: boolean;
}> = ({
	handleClose,
	canManageCall,
	live,
	startCall,
	endCall,
	openNewWindow,
	...props
}) => {
	const t = useTranslation();
	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='phone'/>
			<VerticalBar.Text>{t('Call')}</VerticalBar.Text>
			{handleClose && <VerticalBar.Close onClick={handleClose}/>}
		</VerticalBar.Header>
		<VerticalBar.ScrollableContent {...(props as any)}>
			{ openNewWindow ? <>
				<Box fontScale='p2'>{t('Video_Conference')}</Box>
				<Box fontScale='p1' color='neutral-700'>{t('Opened_in_a_new_window')}</Box>
			</> : null }
			<ButtonGroup stretch>
				{ live && <Button primary onClick={startCall}>{t('BBB_Join_Meeting')}</Button> }
				{ live && canManageCall && <Button danger onClick={endCall}>{t('BBB_End_Meeting')}</Button> }
				{ !live && canManageCall && <Button primary onClick={startCall} >{t('BBB_Start_Meeting')}</Button> }
				{ !live && !canManageCall && <Button primary>{t('BBB_You_have_no_permission_to_start_a_call')}</Button> }
			</ButtonGroup>
		</VerticalBar.ScrollableContent>
	</>;
};


const D: FC<{ rid: IRoom['_id'] }> = ({ rid }) => {
	const handleClose = useTabBarClose();
	const openNewWindow = !!useSetting('bigbluebutton_Open_New_Window');
	const hasCallManagement = usePermission('call-management', rid);
	const room = useRoom();
	const join = useMethod('bbbJoin');
	const end = useMethod('bbbEnd');

	const endCall = useMutableCallback(() => {
		end({ rid });
	});

	const startCall = useMutableCallback(async () => {
		const result = await join({ rid });
		if (!result) {
			return;
		}
		if (openNewWindow) {
			return window.open(result.url);
		}
		popout.open({
			content: 'bbbLiveView',
			data: {
				source: result.url,
				streamingOptions: result,
				canOpenExternal: true,
				showVideoControls: false,
			},
			onCloseCallback: () => false,
		});
	});

	useEffect(() => {
		if (room?.streamingOptions?.type !== 'call' || popout.context) {
			return;
		}
		startCall();
		return (): void => {
			popout.close();
		};
	}, [room?.streamingOptions?.type, startCall]);

	const canManageCall = room?.t === 'd' || hasCallManagement;

	return <CallBBB handleClose={handleClose as () => void} openNewWindow={openNewWindow} live={room?.streamingOptions?.type === 'call'} endCall={endCall} startCall={startCall} canManageCall={canManageCall} />;
};

export default D;
