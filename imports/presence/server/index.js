
import './startup';
import { UsersSessions } from './model';
import presence from './src';

export default presence({
	UserSession: UsersSessions.rawCollection(),
	User: RocketChat.models.Users.model.rawCollection(),
});
