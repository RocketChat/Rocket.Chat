import { MatrixBaseEventHandler } from './BaseEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { MatrixUserReceiverConverter } from '../converters/UserReceiver';
import type { FederationUserServiceListener } from '../../../application/UserServiceListener';
import type { MatrixEventUserTypingStatusChanged } from '../definitions/events/UserTypingStatusChanged';

export class MatrixUserTypingStatusChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.USER_TYPING_STATUS_CHANGED;

	constructor(private userService: FederationUserServiceListener) {
		super();
	}

	public async handle(externalEvent: MatrixEventUserTypingStatusChanged): Promise<void> {
		await this.userService.onUserTyping(MatrixUserReceiverConverter.toUserTypingDto(externalEvent));
	}
}
