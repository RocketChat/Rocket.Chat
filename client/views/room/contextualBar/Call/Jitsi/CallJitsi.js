import React, { useRef, useCallback, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { CallModal } from './components/CallModal';
import { useSetModal } from '../../../../../contexts/ModalContext';
import { useUserSubscription } from '../../../../../contexts/UserContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useSettings } from '../../../../../contexts/SettingsContext';
import VerticalBar from '../../../../../components/VerticalBar';


export const CallJitsi = ({
	handleClose,
	handleWindow,
	refContent,
}) => {
	const t = useTranslation();

	let content;

	if (handleWindow) {
		content = <>
			<Box fontScale='p2'>{t('Video_Conference')}</Box>
			<Box fontScale='p1' color='neutral-700'>{t('Opened_in_a_new_window')}</Box>
		</>;
	} else {
		content = <Box ref={refContent}></Box>;
	}

	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='phone'/>
			<VerticalBar.Text>{t('Call')}</VerticalBar.Text>
			{handleClose && <VerticalBar.Close onClick={handleClose}/>}
		</VerticalBar.Header>
		<VerticalBar.ScrollableContent>
			{content}
		</VerticalBar.ScrollableContent>
	</>;
};

export default React.memo(({ tabBar, rid }) => {
	const handleClose = useMutableCallback(() => tabBar && tabBar.close());
	const setModal = useSetModal();
	const closeModal = useCallback(() => setModal(null), [setModal]);

	const ref = useRef();
	const settings = useSettings({
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
	}).map((setting) => {
		const mapped = {};
		mapped[setting._id] = setting.value;
		return mapped;
	}).reduce((acc, cur) => ({ ...acc, ...cur }));
	const subscription = useUserSubscription();

	const isOpenNewWindow = settings.Jitsi_Open_New_Window;

	const domain = settings.Jitsi_Domain;
	let rname = settings.uniqueID + rid;

	if (settings.Jitsi_URL_Room_Hash) {
		rname = settings.uniqueID + rid;
	} else {
		rname = encodeURIComponent(subscription.t === 'd' ? subscription.usernames.join(' x ') : subscription.name);
	}

	const jitsiRoom = settings.Jitsi_URL_Room_Prefix + rname + settings.Jitsi_URL_Room_Suffix;
	const width = 'auto';
	const height = 500;
	const noSsl = !settings.Jitsi_SSL;
	const isEnabledTokenAuth = settings.Jitsi_Enabled_TokenAuth;
	const accessToken = isEnabledTokenAuth && Meteor.call('jitsi:generateAccessToken', rid);

	const handleYes = useCallback(() => {
		closeModal();

		const configOverwrite = {
			desktopSharingChromeExtId: settings.Jitsi_Chrome_Extension,
		};
		const interfaceConfigOverwrite = {};

		if (isOpenNewWindow) {
			const queryString = accessToken ? `?jwt=${ accessToken }` : '';
			const newWindow = window.open(`${ (noSsl ? 'http://' : 'https://') + domain }/${ jitsiRoom }${ queryString }`, jitsiRoom);

			if (newWindow) {
				const closeInterval = setInterval(() => {
					if (newWindow.closed === false) {
						return;
					}

					tabBar.close();
					clearInterval(closeInterval);
				}, 300);
				return newWindow.focus();
			}
		}

		if (typeof JitsiMeetExternalAPI !== 'undefined') {
			const api = new JitsiMeetExternalAPI(domain, jitsiRoom, width, height, ref.current, configOverwrite, interfaceConfigOverwrite, noSsl, accessToken); // eslint-disable-line no-undef
			api.executeCommand('displayName', [rname]);
		}
	}, [
		accessToken,
		domain,
		jitsiRoom,
		noSsl,
		rname,
		isOpenNewWindow,
		tabBar,
		settings.Jitsi_Chrome_Extension,
		closeModal,
	]);

	const handleCancel = useCallback(() => {
		closeModal();
		tabBar.close();
	}, [closeModal, tabBar]);

	useEffect(() => {
		setModal(() =>
			<CallModal
				handleYes={handleYes}
				handleCancel={handleCancel}
			/>,
		);
	});

	return (
		<CallJitsi
			handleClose={handleClose}
			handleWindow={isOpenNewWindow}
			refContent={ref}
		/>
	);
});
