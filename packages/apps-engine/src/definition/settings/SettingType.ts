/**
 * The input the administration area renders for an {@link settings/ISetting!ISetting | ISetting}, and with it
 * the type of the setting's value.
 */
export enum SettingType {
	/** A toggle. The value is a `boolean`. */
	BOOLEAN = 'boolean',
	/** A multi-line code editor. The value is a `string`. */
	CODE = 'code',
	/** A color picker. The value is a `string`. */
	COLOR = 'color',
	/** A font name. The value is a `string`. */
	FONT = 'font',
	/** A numeric input. The value is a `number`. */
	NUMBER = 'int',
	/** A single choice out of `ISetting.values`. The value is the chosen `key`. */
	SELECT = 'select',
	/** A text input, single line unless `ISetting.multiline` is set. */
	STRING = 'string',
	/** Any number of choices out of `ISetting.values`. The value is an array of keys. */
	MULTI_SELECT = 'multiSelect',
	/**
	 * A text input masked on screen. The value is a `string`.
	 *
	 * The mask is a display choice only: the value is stored in plain text, so do
	 * not treat this type as encryption.
	 */
	PASSWORD = 'password',
	/** A room picker. The value is an array of `{ _id }` objects. */
	ROOM_PICK = 'roomPick',
}
