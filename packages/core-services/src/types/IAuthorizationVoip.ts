import type { RoomAccessValidator } from './IAuthorization';

export interface IAuthorizationVoip {
	canAccessRoom: RoomAccessValidator;
}
