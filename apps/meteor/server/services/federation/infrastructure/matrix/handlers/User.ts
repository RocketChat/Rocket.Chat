import type { FederationUserServiceReceiver } from '../../../application/user/receiver/UserServiceReceiver';
import { MatrixUserReceiverConverter } from '../converters/user/UserReceiver';
import { MatrixEventType } from '../definitions/MatrixEventType';
import type { MatrixEventUserTypingStatusChanged } from '../definitions/events/UserTypingStatusChanged';
import { MatrixBaseEventHandler } from './BaseEvent';

export class MatrixUserTypingStatusChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.USER_TYPING_STATUS_CHANGED;

	constructor(private userService: FederationUserServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventUserTypingStatusChanged): Promise<void> {
		await this.userService.onUserTyping(MatrixUserReceiverConverter.toUserTypingDto(externalEvent));
	}
}
