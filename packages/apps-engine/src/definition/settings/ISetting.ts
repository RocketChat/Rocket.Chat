import type { SettingType } from './SettingType';

/**
 * A configuration value an App declares and the administrator fills in.
 *
 * Register one from `IConfigurationExtend.settings` and read it back with
 * `IEnvironmentRead.getSettings()`. The App owns the shape; the administrator
 * owns the value.
 */
export interface ISetting {
	/** The id of this setting. */
	id: string;
	/** Type of setting this is. */
	type: SettingType;
	/** What is the default value (allows a reset button). */
	packageValue: any;
	/**
	 * The value of this setting. When it is not set, `packageValue` is used instead.
	 *
	 * For a {@link SettingType.ROOM_PICK} setting the value is an array of room ids:
	 * ```js
	 * [{ _id: 'rid1' }, { _id: 'rid2' }]
	 * ```
	 */
	value?: any;
	/** Whether this setting is required or not. */
	required: boolean;
	/** Whether this setting is a public setting or not - administrators can see ones which are not public but users can't. */
	public: boolean;
	/** Whether this setting should be hidden from the user/administrator's eyes (can't be hidden and required). */
	hidden?: boolean;
	/** The selectable values when the setting's type is "select" or "multiSelect". */
	values?: Array<ISettingSelectValue>;
	/** Whether the **string** type is several lines or just one line. */
	multiline?: boolean;
	/** The name of the section where to put this setting under. */
	section?: string;
	/** Name of the setting in the form of a i18n string. */
	i18nLabel: string;
	/** Description of the setting in the form of a i18n string. */
	i18nDescription?: string;
	/** An optional alert messages which is shown to the user on this setting. */
	i18nAlert?: string;
	/** An optional placeholder which will be shown in the form input field, should be an i18n string. */
	i18nPlaceholder?: string;
	/** Date in which this setting was created. */
	createdAt?: Date;
	/** The last time the setting was updated at. */
	updatedAt?: Date;
}

/** One option of a {@link SettingType.SELECT} or {@link SettingType.MULTI_SELECT} setting. */
export interface ISettingSelectValue {
	/** The value stored when the administrator picks this option. */
	key: string;
	/** The i18n string shown for this option. */
	i18nLabel: string;
}
