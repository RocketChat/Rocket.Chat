import { MatrixBaseEventHandler } from './BaseEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import type { MatrixEventUserPresenceChanged } from '../definitions/events/UserPresenceChanged';
import { MatrixUserReceiverConverter } from '../converters/UserReceiver';
import { FederationUserServiceListener } from '../../../application/UserServiceListener';
import { MatrixEventUserTypingStatusChanged } from '../definitions/events/UserTypingStatusChanged';

export class MatrixUserPresenceChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.USER_PRESENCE_CHANGED;

	constructor(private userService: FederationUserServiceListener) {
		super();
	}

	public async handle(externalEvent: MatrixEventUserPresenceChanged): Promise<void> {
		await this.userService.onUserPresence(MatrixUserReceiverConverter.toUserPresenceDto(externalEvent));
	}
}

export class MatrixUserTypingStatusChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.USER_TYPING_STATUS_CHANGED;

	constructor(private userService: FederationUserServiceListener) {
		super();
	}

	public async handle(externalEvent: MatrixEventUserTypingStatusChanged): Promise<void> {
		await this.userService.onUserTyping(MatrixUserReceiverConverter.toUserTypingDto(externalEvent));
	}
}
