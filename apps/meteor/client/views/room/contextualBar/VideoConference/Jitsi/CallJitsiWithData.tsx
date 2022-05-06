import { IRoom } from '@rocket.chat/core-typings';
import { Skeleton, Icon, Box } from '@rocket.chat/fuselage';
import { useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import { clear } from '@rocket.chat/memo';
import {
	useConnectionStatus,
	useSetModal,
	useToastMessageDispatch,
	useUser,
	useSettings,
	useMethod,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import React, { ReactElement, useRef, useEffect, useState, useMemo, useLayoutEffect, memo } from 'react';

import { Subscriptions } from '../../../../../../app/models/client';
import { HEARTBEAT, TIMEOUT, DEBOUNCE } from '../../../../../../app/videobridge/constants';
import GenericModal from '../../../../../components/GenericModal';
import { useRoom } from '../../../contexts/RoomContext';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import CallJitsi from './CallJitsi';
import { JitsiBridge } from './lib/JitsiBridge';

const querySettings = {
	_id: [
		'Jitsi_Open_New_Window',
		'Jitsi_Domain',
		'Jitsi_URL_Room_Hash',
		'uniqueID',
		'Jitsi_URL_Room_Prefix',
		'Jitsi_URL_Room_Suffix',
		'Jitsi_Chrome_Extension',
		'Jitsi_SSL',
		'Jitsi_Enabled_TokenAuth',
	],
};

const CallJitsiWithData = ({ rid }: { rid: IRoom['_id'] }): ReactElement => {
	const user = useUser();
	const { connected } = useConnectionStatus();
	const [accessToken, setAccessToken] = useSafely(useState());
	const [accepted, setAccepted] = useState(false);
	const room = useRoom();
	const ref = useRef<HTMLDivElement>(null);
	const setModal = useSetModal();
	const handleClose = useTabBarClose();
	const closeModal = useMutableCallback(() => setModal(null));
	const generateAccessToken = useMethod('jitsi:generateAccessToken');
	const updateTimeout = useMethod('jitsi:updateTimeout');
	const joinRoom = useMethod('joinRoom');
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleCancel = useMutableCallback(() => {
		closeModal();
		handleClose();
	});

	const {
		Jitsi_Open_New_Window: openNewWindow,
		Jitsi_Domain: domain,
		Jitsi_SSL: ssl,
		Jitsi_Chrome_Extension: desktopSharingChromeExtId,
		Jitsi_URL_Room_Hash: useHashName,
		uniqueID,
		Jitsi_URL_Room_Prefix: prefix,
		Jitsi_URL_Room_Suffix: sufix,
		Jitsi_Enabled_TokenAuth: isEnabledTokenAuth,
	} = Object.fromEntries(useSettings(querySettings).map(({ _id, value }) => [_id, value]));

	useEffect(() => {
		let ignore = false;
		if (!isEnabledTokenAuth) {
			setAccessToken(undefined);
			return;
		}

		(async (): Promise<void> => {
			const accessToken = await generateAccessToken(rid);
			!ignore && setAccessToken(accessToken);
		})();

		return (): void => {
			ignore = true;
		};
	}, [generateAccessToken, isEnabledTokenAuth, rid, setAccessToken]);

	useLayoutEffect(() => {
		if (!connected) {
			handleClose();
		}
	}, [connected, handleClose]);

	const rname = useHashName ? uniqueID + rid : encodeURIComponent((room?.t === 'd' ? room.usernames?.join('x') : room.name) ?? '');

	const jitsi = useMemo(() => {
		if (isEnabledTokenAuth && !accessToken) {
			return;
		}

		const jitsiRoomName = prefix + rname + sufix;

		return new JitsiBridge(
			{
				openNewWindow,
				ssl,
				domain,
				jitsiRoomName,
				accessToken,
				desktopSharingChromeExtId,
				name: user?.name || user?.username,
			},
			HEARTBEAT,
		);
	}, [
		accessToken,
		desktopSharingChromeExtId,
		domain,
		isEnabledTokenAuth,
		openNewWindow,
		prefix,
		rname,
		ssl,
		sufix,
		user?.name,
		user?.username,
	]);

	const testAndHandleTimeout = useMutableCallback(() => {
		if (jitsi?.openNewWindow) {
			if (jitsi?.window?.closed) {
				return jitsi.dispose();
			}

			try {
				return updateTimeout(rid, false);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t(error.reason) });
				clear(() => undefined);
				handleClose();
				return jitsi.dispose();
			}
		}

		if (new Date().valueOf() - new Date(room.jitsiTimeout ?? '').valueOf() > TIMEOUT) {
			return jitsi?.dispose();
		}

		if (new Date().valueOf() - new Date(room.jitsiTimeout ?? '').valueOf() + TIMEOUT > DEBOUNCE) {
			try {
				return updateTimeout(rid, false);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t(error.reason) });
				clear(() => undefined);
				handleClose();
				return jitsi?.dispose();
			}
		}
	});

	useEffect(() => {
		if (!accepted || !jitsi) {
			return;
		}

		const clear = (): void => {
			jitsi.off('HEARTBEAT', testAndHandleTimeout);
			jitsi.dispose();
		};

		try {
			if (jitsi.needsStart) {
				jitsi.start(ref.current);
				updateTimeout(rid, true);
			} else {
				updateTimeout(rid, false);
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t(error.reason) });
			clear();
			handleClose();
		}
		jitsi.on('HEARTBEAT', testAndHandleTimeout);

		return (): void => {
			if (!jitsi.openNewWindow) clear();
		};
	}, [accepted, jitsi, rid, testAndHandleTimeout, updateTimeout, dispatchToastMessage, handleClose, t]);

	const handleConfirm = useMutableCallback(() => {
		if (jitsi) {
			jitsi.needsStart = true;
		}

		setAccepted(true);
		const sub = Subscriptions.findOne({ rid, 'u._id': user?._id });
		if (!sub) {
			joinRoom(rid);
		}

		if (openNewWindow) {
			handleClose();
		}
	});

	useLayoutEffect(() => {
		if (!accepted) {
			return setModal(() => (
				<GenericModal
					variant='warning'
					title={t('Video_Conference')}
					confirmText={t('Yes')}
					onClose={handleCancel}
					onCancel={handleCancel}
					onConfirm={handleConfirm}
				>
					<Box display='flex' flexDirection='column' alignItems='center'>
						<Icon name='modal-warning' size='x128' color='warning-500' />
						<Box fontScale='h4'>{t('Start_video_call')}</Box>
					</Box>
				</GenericModal>
			));
		}

		closeModal();
	}, [accepted, closeModal, handleCancel, handleConfirm, setModal, t]);

	return (
		<CallJitsi handleClose={handleClose} openNewWindow={openNewWindow} refContent={ref}>
			{!accepted && <Skeleton />}
		</CallJitsi>
	);
};

export default memo(CallJitsiWithData);
