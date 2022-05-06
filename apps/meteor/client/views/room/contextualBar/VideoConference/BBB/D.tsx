import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, usePermission, useMethod } from '@rocket.chat/ui-contexts';
import React, { FC, useEffect } from 'react';

import { popout } from '../../../../../../app/ui-utils/client';
import { useRoom } from '../../../contexts/RoomContext';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import CallBBB from './CallBBB';

type DProps = {
	rid: IRoom['_id'];
};

const D: FC<DProps> = ({ rid }) => {
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
		if (room?.streamingOptions?.type !== 'call' || openNewWindow || popout.context) {
			return;
		}
		startCall();
		return (): void => {
			popout.close();
		};
	}, [room?.streamingOptions?.type, startCall, openNewWindow]);

	const canManageCall = room?.t === 'd' || hasCallManagement;

	return (
		<CallBBB
			handleClose={handleClose as () => void}
			openNewWindow={openNewWindow}
			live={room?.streamingOptions?.type === 'call'}
			endCall={endCall}
			startCall={startCall}
			canManageCall={canManageCall}
		/>
	);
};

export default D;
