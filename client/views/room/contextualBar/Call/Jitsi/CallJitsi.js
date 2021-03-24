import React, { useRef, useEffect, useState, useMemo, useLayoutEffect } from 'react';
import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';

import { CallModal } from './components/CallModal';
import { useSetModal } from '../../../../../contexts/ModalContext';
import { useUserRoom, useUser } from '../../../../../contexts/UserContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useSettings } from '../../../../../contexts/SettingsContext';
import VerticalBar from '../../../../../components/VerticalBar';
import { HEARTBEAT, TIMEOUT, DEBOUNCE } from '../../../../../../app/videobridge/constants';
import { useMethod } from '../../../../../contexts/ServerContext';
import { useConnectionStatus } from '../../../../../contexts/ConnectionStatusContext';
import { JitsiBridge } from './lib/JitsiBridge';
import { useTabBarClose } from '../../../providers/ToolboxProvider';

export const CallJitsi = ({
	handleClose,
	openNewWindow,
	refContent,
	children,
}) => {
	const t = useTranslation();

	const content = openNewWindow ? <>
		<Box fontScale='p2'>{t('Video_Conference')}</Box>
		<Box fontScale='p1' color='neutral-700'>{t('Opened_in_a_new_window')}</Box>
	</> : <div ref={refContent}/>;

	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='phone'/>
			<VerticalBar.Text>{t('Call')}</VerticalBar.Text>
			{handleClose && <VerticalBar.Close onClick={handleClose}/>}
		</VerticalBar.Header>
		<VerticalBar.ScrollableContent>
			{content}
			{children}
		</VerticalBar.ScrollableContent>
	</>;
};

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
	const room = useUserRoom(rid);
	const setModal = useSetModal();
	const handleClose = useTabBarClose();
	const closeModal = useMutableCallback(() => setModal(null));
	const generateAccessToken = useMethod('jitsi:generateAccessToken');
	const updateTimeout = useMethod('jitsi:updateTimeout');

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
		return () => { ignore = true; };
	}, [generateAccessToken, isEnabledTokenAuth, rid, setAccessToken]);

	useLayoutEffect(() => {
		if (!connected) {
			handleClose();
		}
	}, [connected, handleClose]);

	const rname = useHashName ? uniqueID + rid : encodeURIComponent(room.t === 'd' ? room.usernames.join(' x ') : room.name);

	const jitsi = useMemo(() => {
		if (isEnabledTokenAuth && ! accessToken) {
			return;
		}

		const jitsiRoomName = prefix + rname + sufix;

		return new JitsiBridge({
			openNewWindow,
			ssl,
			domain,
			jitsiRoomName,
			accessToken,
			desktopSharingChromeExtId,
			name: user.name || user.username,
		}, HEARTBEAT);
	}, [accessToken, desktopSharingChromeExtId, domain, isEnabledTokenAuth, openNewWindow, prefix, rname, ssl, sufix, user.name, user.username]);

	const testAndHandleTimeout = useMutableCallback(() => {
		if (new Date() - new Date(room.jitsiTimeout) > TIMEOUT) {
			return jitsi.dispose();
		}

		if (new Date() - new Date(room.jitsiTimeout) + TIMEOUT > DEBOUNCE) {
			return updateTimeout(rid);
		}
	});

	useEffect(() => {
		if (!accepted || !jitsi) {
			return;
		}
		jitsi.start(ref.current);

		updateTimeout(rid);

		jitsi.on('HEARTBEAT', testAndHandleTimeout);

		return () => {
			jitsi.off('HEARTBEAT', testAndHandleTimeout);
			jitsi.dispose();
		};
	}, [accepted, jitsi, rid, testAndHandleTimeout, updateTimeout]);

	const handleYes = useMutableCallback(() => {
		setAccepted(true);
		if (openNewWindow) {
			handleClose();
		}
	});

	useLayoutEffect(() => {
		if (!accepted) {
			setModal(() =>
				<CallModal
					handleYes={handleYes}
					handleCancel={handleCancel}
				/>,
			);
			return;
		}
		closeModal();
	}, [accepted, closeModal, handleCancel, handleYes, setModal]);

	return (
		<CallJitsi
			handleClose={handleClose}
			openNewWindow={openNewWindow}
			refContent={ref}
		>
			{!accepted && <Skeleton/>}
		</CallJitsi>
	);
};

export default React.memo(CallJitsWithData);
