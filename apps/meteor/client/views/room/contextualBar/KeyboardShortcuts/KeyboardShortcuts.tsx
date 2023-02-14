import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import KeyboardShortcutSection from './KeyboardShortcutSection';

const KeyboardShortcuts = ({ handleClose }: { handleClose: () => void }): ReactElement => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='keyboard' />
				<VerticalBar.Text>{t('Keyboard_Shortcuts_Title')}</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Open_Channel_Slash_User_Search')} command={t('Keyboard_Shortcuts_Keys_1')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Mark_all_as_read')} command={t('Keyboard_Shortcuts_Keys_8')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Edit_Previous_Message')} command={t('Keyboard_Shortcuts_Keys_2')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Move_To_Beginning_Of_Message')} command={t('Keyboard_Shortcuts_Keys_3')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Move_To_Beginning_Of_Message')} command={t('Keyboard_Shortcuts_Keys_4')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Move_To_End_Of_Message')} command={t('Keyboard_Shortcuts_Keys_5')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Move_To_End_Of_Message')} command={t('Keyboard_Shortcuts_Keys_6')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_New_Line_In_Message')} command={t('Keyboard_Shortcuts_Keys_7')} />
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default memo(KeyboardShortcuts);
