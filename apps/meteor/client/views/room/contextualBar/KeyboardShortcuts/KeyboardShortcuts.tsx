import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import KeyboardShortcutSection from './KeyboardShortcutSection';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarDialog,
} from '../../../../components/Contextualbar';

let os = 'unknown';

if (navigator.userAgentData && navigator.userAgentData.platform) {
    os = navigator.userAgentData.platform.toLowerCase();
} else {
    // Fallback for Firefox, Safari, older browsers
    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes("win")) os = "windows";
    else if (ua.includes("mac")) os = "macos";
    else if (ua.includes("linux")) os = "linux";
    else if (ua.includes("android")) os = "android";
    else if (ua.includes("iphone") || ua.includes("ipad")) os = "ios";
}

const KeyboardShortcuts = ({ handleClose }: { handleClose: () => void }): ReactElement => {
	const { t } = useTranslation();

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='keyboard' />
				<ContextualbarTitle>{t('Keyboard_Shortcuts_Title')}</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Open_Channel_Slash_User_Search')} command={os === 'macos' || os === 'macintel' || os === 'macintosh' ? t('Keyboard_Shortcuts_Keys_1_mac') : t('Keyboard_Shortcuts_Keys_1_win')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Mark_all_as_read')} command={os === 'macos' || os === 'macintel' || os === 'macintosh' ? t('Keyboard_Shortcuts_Keys_8_mac') : t('Keyboard_Shortcuts_Keys_8_win')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Edit_Previous_Message')} command={t('Keyboard_Shortcuts_Keys_2')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Move_To_Beginning_Of_Message')} command={os === 'macos' || os === 'macintel' || os === 'macintosh' ? t('Keyboard_Shortcuts_Keys_3_mac') : t('Keyboard_Shortcuts_Keys_3_win')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Move_To_Beginning_Of_Message')} command={os === 'macos' || os === 'macintel' || os === 'macintosh' ? t('Keyboard_Shortcuts_Keys_4_mac') : t('Keyboard_Shortcuts_Keys_4_win')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Move_To_End_Of_Message')} command={os === 'macos' || os === 'macintel' || os === 'macintosh' ? t('Keyboard_Shortcuts_Keys_5_mac') : t('Keyboard_Shortcuts_Keys_5_win')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_Move_To_End_Of_Message')} command={os === 'macos' || os === 'macintel' || os === 'macintosh' ? t('Keyboard_Shortcuts_Keys_6_mac') : t('Keyboard_Shortcuts_Keys_6_win')} />
				<KeyboardShortcutSection title={t('Keyboard_Shortcuts_New_Line_In_Message')} command={t('Keyboard_Shortcuts_Keys_7')} />
			</ContextualbarScrollableContent>
		</ContextualbarDialog>
	);
};

export default memo(KeyboardShortcuts);
