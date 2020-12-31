import React from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Box, Divider } from '@rocket.chat/fuselage';


import { useLanguage, useTranslation } from '../../../../contexts/TranslationContext';
import VerticalBar from '../../../../components/VerticalBar';
import useOsPlatform from '../hooks/useOsPlatform';

const ShortcutSection = ({ title, command }) =>
	<Box is='section' mb='x16'>
		<Box fontScale='p2' fontWeight='700'>{title}</Box>
		<Divider />
		<Box fontScale='p1'>{command}</Box>
	</Box>;

export const KeyboardShortcuts = ({ handleClose }) => {
	const t = useTranslation();
	const lang = useLanguage();
	const osPlat = useOsPlatform();

	let os = '';
	if (lang === 'en') {
		if (osPlat === 'linux' || osPlat === 'windows') {
			os = '_win';
		} else if (osPlat === 'macos') {
			os = '_mac';
		}
	}

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='keyboard'/>
				<VerticalBar.Text>{t('Keyboard_Shortcuts_Title')}</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose}/>}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<ShortcutSection
					title={t('Keyboard_Shortcuts_Open_Channel_Slash_User_Search')}
					command={t(`Keyboard_Shortcuts_Keys_1${ os }`)}
				/>
				<ShortcutSection
					title={t('Keyboard_Shortcuts_Mark_all_as_read')}
					command={t(`Keyboard_Shortcuts_Keys_8${ os }`)}
				/>
				<ShortcutSection
					title={t('Keyboard_Shortcuts_Edit_Previous_Message')}
					command={t(`Keyboard_Shortcuts_Keys_2${ os }`)}
				/>
				<ShortcutSection
					title={t('Keyboard_Shortcuts_Move_To_Beginning_Of_Message')}
					command={t(`Keyboard_Shortcuts_Keys_3${ os }`)}
				/>
				<ShortcutSection
					title={t('Keyboard_Shortcuts_Move_To_Beginning_Of_Message')}
					command={t(`Keyboard_Shortcuts_Keys_4${ os }`)}
				/>
				<ShortcutSection
					title={t('Keyboard_Shortcuts_Move_To_End_Of_Message')}
					command={t(`Keyboard_Shortcuts_Keys_5${ os }`)}
				/>
				<ShortcutSection
					title={t('Keyboard_Shortcuts_Move_To_End_Of_Message')}
					command={t(`Keyboard_Shortcuts_Keys_6${ os }`)}
				/>
				<ShortcutSection
					title={t('Keyboard_Shortcuts_New_Line_In_Message')}
					command={t(`Keyboard_Shortcuts_Keys_7${ os }`)}
				/>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default React.memo(({ tabBar }) => {
	const handleClose = useMutableCallback(() => tabBar && tabBar.close());
	return <KeyboardShortcuts handleClose={handleClose}/>;
});
