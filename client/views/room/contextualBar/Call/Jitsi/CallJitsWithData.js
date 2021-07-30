import { Skeleton } from '@rocket.chat/fuselage';
import { useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import { clear } from '@rocket.chat/memo';
import React, { useRef, useEffect, useState, useMemo, useLayoutEffect, memo } from 'react';

import { HEARTBEAT, TIMEOUT, DEBOUNCE } from '../../../../../../app/videobridge/constants';
import { useConnectionStatus } from '../../../../../contexts/ConnectionStatusContext';
import { useSetModal } from '../../../../../contexts/ModalContext';
import { useMethod } from '../../../../../contexts/ServerContext';
import { useSettings } from '../../../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUser } from '../../../../../contexts/UserContext';
import { useRoom } from '../../../contexts/RoomContext';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import CallJitsi from './CallJitsi';
import CallModal from './components/CallModal';
import { JitsiBridge } from './lib/JitsiBridge';

export { default as CallJitsi } from './CallJitsi';

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

const CallJitsWithData = ({ rid }) => {
	const user = useUser();
	const { connected } = useConnectionStatus();
	const [accessToken, setAccessToken] = useSafely(useState());
	const [accepted, setAccepted] = useState(false);
	const room = useRoom();
	const setModal = useSetModal();
	const handleClose = useTabBarClose();
	const closeModal = useMutableCallback(() => setModal(null));
	const generateAccessToken = useMethod('jitsi:generateAccessToken');
	const updateTimeout = useMethod('jitsi:updateTimeout');
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleCancel = useMutableCallback(() => {
		closeModal();
		handleClose();
	});

	const ref = useRef();

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
			setAccessToken();
			return;
		}
		(async () => {
			const accessToken = await generateAccessToken(rid);
			!ignore && setAccessToken(accessToken);
		})();
		return () => {
			ignore = true;
		};
	}, [generateAccessToken, isEnabledTokenAuth, rid, setAccessToken]);

	useLayoutEffect(() => {
		if (!connected) {
			handleClose();
		}
	}, [connected, handleClose]);

	const rname = useHashName
		? uniqueID + rid
		: encodeURIComponent(room.t === 'd' ? room.usernames.join(' x ') : room.name);

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
				name: user.name || user.username,
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
		user.name,
		user.username,
	]);

	const testAndHandleTimeout = useMutableCallback(async () => {
		if (jitsi.openNewWindow) {
			if (jitsi.window?.closed) {
				return jitsi.dispose();
			}
			try {
				await updateTimeout(rid, false);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t(error.reason) });
				clear();
				handleClose();
				return jitsi.dispose();
			}
		}
		if (new Date() - new Date(room.jitsiTimeout) > TIMEOUT) {
			return jitsi.dispose();
		}

		if (new Date() - new Date(room.jitsiTimeout) + TIMEOUT > DEBOUNCE) {
			try {
				await updateTimeout(rid, false);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t(error.reason) });
				clear();
				handleClose();
				return jitsi.dispose();
			}
		}
	});

	useEffect(() => {
		let shouldDispose = false;

		async function fetchData() {
			if (!accepted || !jitsi) {
				return;
			}

			const clear = () => {
				jitsi.off('HEARTBEAT', testAndHandleTimeout);
				jitsi.dispose();
			};

			try {
				if (jitsi.needsStart) {
					jitsi.start(ref.current);
					await updateTimeout(rid, true);
				} else {
					await updateTimeout(rid, false);
				}
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t(error.reason) });
				clear();
				handleClose();
			}

			jitsi.on('HEARTBEAT', testAndHandleTimeout);

			shouldDispose = !jitsi.openNewWindow;
		}

		fetchData().then(() => {
			if (shouldDispose) {
				jitsi.dispose();
			}
		});
	}, [
		accepted,
		jitsi,
		rid,
		testAndHandleTimeout,
		updateTimeout,
		dispatchToastMessage,
		handleClose,
		t,
	]);

	const handleYes = useMutableCallback(() => {
		if (jitsi) {
			jitsi.needsStart = true;
		}

		setAccepted(true);

		if (openNewWindow) {
			handleClose();
		}
	});

	useLayoutEffect(() => {
		if (!accepted) {
			setModal(() => <CallModal handleYes={handleYes} handleCancel={handleCancel} />);
			return;
		}
		closeModal();
	}, [accepted, closeModal, handleCancel, handleYes, setModal]);

	return (
		<CallJitsi handleClose={handleClose} openNewWindow={openNewWindow} refContent={ref}>
			{!accepted && <Skeleton />}
		</CallJitsi>
	);
};

export default memo(CallJitsWithData);
