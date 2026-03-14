import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import KeyboardShortcutSection from './KeyboardShortcutSection';

const keyboardShortcutItems = [
	{ titleKey: 'Keyboard_Shortcuts_Open_Channel_Slash_User_Search', commandKey: 'Keyboard_Shortcuts_Keys_1' },
	{ titleKey: 'Keyboard_Shortcuts_Mark_all_as_read', commandKey: 'Keyboard_Shortcuts_Keys_8' },
	{ titleKey: 'Keyboard_Shortcuts_Edit_Previous_Message', commandKey: 'Keyboard_Shortcuts_Keys_2' },
	{ titleKey: 'Keyboard_Shortcuts_Move_To_Beginning_Of_Message', commandKey: 'Keyboard_Shortcuts_Keys_4' },
	{ titleKey: 'Keyboard_Shortcuts_Move_To_End_Of_Message', commandKey: 'Keyboard_Shortcuts_Keys_6' },
	{ titleKey: 'Keyboard_Shortcuts_New_Line_In_Message', commandKey: 'Keyboard_Shortcuts_Keys_7' },
] as const;

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
				{keyboardShortcutItems.map((item, index) => (
					<KeyboardShortcutSection
						key={`${item.titleKey}-${index}`}
						title={t(item.titleKey)}
						command={t(item.commandKey)}
					/>
				))}
			</ContextualbarScrollableContent>
		</ContextualbarDialog>
	);
};

export default memo(KeyboardShortcuts);
