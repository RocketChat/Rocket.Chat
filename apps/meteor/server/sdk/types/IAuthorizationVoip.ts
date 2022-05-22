import { RoomAccessValidator } from './IAuthorization';

export interface IAuthorizationVoip {
	canAccessRoom: RoomAccessValidator;
}
