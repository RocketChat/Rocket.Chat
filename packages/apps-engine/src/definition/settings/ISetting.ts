import type { SettingType } from './SettingType';

export interface ISetting {
    /** The id of this setting. */
    id: string;
    /** Type of setting this is. */
    type: SettingType;
    /** What is the default value (allows a reset button). */
    packageValue: any;
    /** Will be the value of this setting. If nothing is set here, then the "packageValue" will be used. */
    /**
     * If the setting type is ROOM_PICK, the value will be an array of room ids.
     * @returns ```js
     * [{_id: 'rid1'}, {_id: 'rid2'}]
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

export interface ISettingSelectValue {
    key: string;
    i18nLabel: string;
}
