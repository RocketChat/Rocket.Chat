import type { FederationMessageServiceListener } from '../../../application/MessageServiceListener';
import { MatrixMessageReceiverConverter } from '../converters/MessageReceiver';
import type { MatrixEventMessageReact } from '../definitions/events/MessageReacted';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { MatrixBaseEventHandler } from './BaseEvent';

export class MatrixMessageReactedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.MESSAGE_REACTED;

	constructor(private messageService: FederationMessageServiceListener) {
		super();
	}

	public async handle(externalEvent: MatrixEventMessageReact): Promise<void> {
		await this.messageService.onMessageReaction(MatrixMessageReceiverConverter.toMessageReactionDto(externalEvent));
	}
}
