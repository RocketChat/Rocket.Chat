export enum SettingType {
    BOOLEAN = 'boolean',
    CODE = 'code',
    COLOR = 'color',
    FONT = 'font',
    NUMBER = 'int',
    SELECT = 'select',
    STRING = 'string',
    MULTI_SELECT = 'multiSelect',
    // Renders an input of type 'password' in the form. IMPORTANT - the value will NOT be encrypted
    // it will be treated as a password just on the screen
    PASSWORD = 'password',
    ROOM_PICK = 'roomPick',
}
