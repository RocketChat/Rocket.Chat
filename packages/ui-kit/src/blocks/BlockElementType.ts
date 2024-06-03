import type { BlockElement } from './BlockElement';

export enum BlockElementType {
	BUTTON = 'button',
	IMAGE = 'image',
	OVERFLOW = 'overflow',
	/** @deprecated */
	OVERFLOW_MENU = 'overflow',
	PLAIN_TEXT_INPUT = 'plain_text_input',
	STATIC_SELECT = 'static_select',
	MULTI_STATIC_SELECT = 'multi_static_select',
	/** @deprecated */
	CONVERSATION_SELECT = 'conversations_select',
	/** @deprecated */
	CHANNEL_SELECT = 'channels_select',
	/** @deprecated */
	USER_SELECT = 'users_select',
	CONVERSATIONS_SELECT = 'conversations_select',
	CHANNELS_SELECT = 'channels_select',
	USERS_SELECT = 'users_select',
	DATEPICKER = 'datepicker',
	LINEAR_SCALE = 'linear_scale',
	MULTI_CHANNELS_SELECT = 'multi_channels_select',
	MULTI_CONVERSATIONS_SELECT = 'multi_conversations_select',
	MULTI_USERS_SELECT = 'multi_users_select',
	TOGGLE_SWITCH = 'toggle_switch',
	RADIO_BUTTON = 'radio_button',
	CHECKBOX = 'checkbox',
	TIME_PICKER = 'time_picker',
	TAB = 'tab',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AssertEnumKeysFromBlockUnionTypes = {
	[B in BlockElement as Uppercase<B['type']>]: (typeof BlockElementType)[Uppercase<B['type']>];
};
