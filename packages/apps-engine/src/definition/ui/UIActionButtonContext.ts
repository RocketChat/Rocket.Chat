/**
 * Where in the UI an App's action button is placed.
 *
 * The surface decides which fields of the interaction are filled in: only a
 * button on a message brings a `message`, and a button outside a room brings
 * no meaningful `room`. Check for the ones you need in the handler.
 */
export enum UIActionButtonContext {
	/** The action menu of a single message. */
	MESSAGE_ACTION = 'messageAction',
	/** The room's kebab menu. */
	ROOM_ACTION = 'roomAction',
	/** The message composer's toolbar. */
	MESSAGE_BOX_ACTION = 'messageBoxAction',
	/** The avatar dropdown, reachable from anywhere in the workspace. */
	USER_DROPDOWN_ACTION = 'userDropdownAction',
	/** The room's contextual bar. */
	ROOM_SIDEBAR_ACTION = 'roomSideBarAction',
}
