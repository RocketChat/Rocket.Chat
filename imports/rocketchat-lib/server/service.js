import addOAuthService from './actions/addOAuthService';
import addUsersToRoom from './actions/addUsersToRoom';
import archiveRoom from './actions/archiveRoom';
import blockUser from './actions/blockUser';
import checkUsernameAvailability from './actions/checkUsernameAvailability';
import cleanRoomHistory from './actions/cleanRoomHistory';
import createRoom from './actions/createRoom';
import sendMessage from './actions/sendMessage';

// import blockUser from './actions/blockUser';
// import blockUser from './actions/blockUser';
// import blockUser from './actions/blockUser';
// import blockUser from './actions/blockUser';
// import blockUser from './actions/blockUser';

export default {
	name: 'core',
	actions: {
		...addOAuthService,
		...addUsersToRoom,
		...archiveRoom,
		...blockUser,
		...checkUsernameAvailability,
		...cleanRoomHistory,
		...createRoom,

		...sendMessage,
	},
};
