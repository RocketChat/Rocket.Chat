/*
	What is this file? Great question! To make Rocket.Chat more "modular"
	and to make the "rocketchat:lib" package more of a core package
	with the libraries, this index file contains the exported members
	for the *server* pieces of code which does include the shared
	library files.
*/

import { RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig } from '../../lib/RoomTypeConfig';

export {
	RoomSettingsEnum,
	RoomTypeConfig,
	RoomTypeRouteConfig
};
