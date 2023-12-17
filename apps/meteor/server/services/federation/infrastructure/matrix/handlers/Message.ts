import type { FederationMessageServiceReceiver } from '../../../application/room/message/receiver/MessageServiceReceiver';
import { MatrixMessageReceiverConverter } from '../converters/room/MessageReceiver';
import { MatrixEventType } from '../definitions/MatrixEventType';
import type { MatrixEventMessageReact } from '../definitions/events/MessageReacted';
import { MatrixBaseEventHandler } from './BaseEvent';

export class MatrixMessageReactedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.MESSAGE_REACTED;

	constructor(private messageService: FederationMessageServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventMessageReact): Promise<void> {
		await this.messageService.onMessageReaction(MatrixMessageReceiverConverter.toMessageReactionDto(externalEvent));
	}
}
