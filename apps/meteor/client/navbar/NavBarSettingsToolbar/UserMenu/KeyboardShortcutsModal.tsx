import { Box, Divider } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { Fragment, memo } from 'react';
import { useTranslation } from 'react-i18next';

type KeyCombo = {
	mac: readonly string[];
	other: readonly string[];
};

type ShortcutDefinition = {
	id: string;
	descriptionKey: string;
	combos: readonly KeyCombo[];
};

const SHORTCUTS: readonly ShortcutDefinition[] = [
	{
		id: 'openKeyboardShortcuts',
		descriptionKey: 'Keyboard_Shortcuts_Show_Keyboard_Shortcuts',
		combos: [{ mac: ['Shift', '?'], other: ['Shift', '?'] }],
	},
	{
		id: 'openSearch',
		descriptionKey: 'Keyboard_Shortcuts_Open_Channel_Slash_User_Search',
		combos: [
			{ mac: ['Command', 'P'], other: ['Control', 'P'] },
			{ mac: ['Command', 'K'], other: ['Control', 'K'] },
		],
	},
	{
		id: 'markAllAsRead',
		descriptionKey: 'Keyboard_Shortcuts_Mark_all_as_read',
		combos: [{ mac: ['Shift', 'Escape'], other: ['Control', 'Escape'] }],
	},
	{
		id: 'editPreviousMessage',
		descriptionKey: 'Keyboard_Shortcuts_Edit_Previous_Message',
		combos: [{ mac: ['ArrowUp'], other: ['ArrowUp'] }],
	},
	{
		id: 'moveToBeginningHorizontal',
		descriptionKey: 'Keyboard_Shortcuts_Move_To_Beginning_Of_Message',
		combos: [{ mac: ['Command', 'ArrowLeft'], other: ['Alt', 'ArrowLeft'] }],
	},
	{
		id: 'moveToBeginningVertical',
		descriptionKey: 'Keyboard_Shortcuts_Move_To_Beginning_Of_Message',
		combos: [{ mac: ['Command', 'ArrowUp'], other: ['Alt', 'ArrowUp'] }],
	},
	{
		id: 'moveToEndHorizontal',
		descriptionKey: 'Keyboard_Shortcuts_Move_To_End_Of_Message',
		combos: [{ mac: ['Command', 'ArrowRight'], other: ['Alt', 'ArrowRight'] }],
	},
	{
		id: 'moveToEndVertical',
		descriptionKey: 'Keyboard_Shortcuts_Move_To_End_Of_Message',
		combos: [{ mac: ['Command', 'ArrowDown'], other: ['Alt', 'ArrowDown'] }],
	},
	{
		id: 'newLine',
		descriptionKey: 'Keyboard_Shortcuts_New_Line_In_Message',
		combos: [{ mac: ['Shift', 'Enter'], other: ['Shift', 'Enter'] }],
	},
];

const KEY_LABEL_TRANSLATIONS: Record<string, string> = {
	Command: 'Keyboard_Shortcut_Key_Command',
	Control: 'Keyboard_Shortcut_Key_Control',
	Option: 'Keyboard_Shortcut_Key_Option',
	Alt: 'Keyboard_Shortcut_Key_Alt',
	Shift: 'Keyboard_Shortcut_Key_Shift',
	Enter: 'Keyboard_Shortcut_Key_Enter',
	Escape: 'Keyboard_Shortcut_Key_Escape',
	ArrowUp: 'Keyboard_Shortcut_Key_ArrowUp',
	ArrowDown: 'Keyboard_Shortcut_Key_ArrowDown',
	ArrowLeft: 'Keyboard_Shortcut_Key_ArrowLeft',
	ArrowRight: 'Keyboard_Shortcut_Key_ArrowRight',
};

const isMacPlatform = (): boolean =>
	typeof navigator !== 'undefined' && typeof navigator.platform === 'string' && navigator.platform.toLowerCase().includes('mac');

type KeyboardShortcutsModalProps = {
	onClose: () => void;
};

const KeyboardShortcutsModal = ({ onClose }: KeyboardShortcutsModalProps) => {
	const { t } = useTranslation();
	const isMac = isMacPlatform();

	return (
		<GenericModal icon='keyboard' variant='info' title={t('Keyboard_Shortcuts_Title')} cancelText={t('Close')} onCancel={onClose}>
			<Box is='dl' aria-label={t('Keyboard_Shortcuts_Title')} m={0}>
				{SHORTCUTS.map(({ id, descriptionKey, combos }) => (
					<Box key={id} mbe={12}>
						<Box is='dt' fontScale='p2m' fontWeight='700' mbe={4}>
							{t(descriptionKey)}
						</Box>
						<Box is='dd' fontScale='p2' m={0} mbe={8}>
							{combos.map((combo, comboIndex) => {
								const keys = isMac ? combo.mac : combo.other;
								return (
									<Fragment key={comboIndex}>
										{comboIndex > 0 && (
											<Box is='span' mi={8} color='hint'>
												{t('or')}
											</Box>
										)}
										<Box is='kbd'>
											{keys.map((token, tokenIndex) => (
												<Fragment key={tokenIndex}>
													{tokenIndex > 0 && (
														<Box is='span' mi={4} aria-hidden='true'>
															+
														</Box>
													)}
													<Box is='kbd'>{KEY_LABEL_TRANSLATIONS[token] ? t(KEY_LABEL_TRANSLATIONS[token]) : token}</Box>
												</Fragment>
											))}
										</Box>
									</Fragment>
								);
							})}
						</Box>
						<Divider aria-hidden='true' m={0} />
					</Box>
				))}
			</Box>
		</GenericModal>
	);
};

export default memo(KeyboardShortcutsModal);
