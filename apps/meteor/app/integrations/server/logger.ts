import { Logger } from '@rocket.chat/logger';

const logger = new Logger('Integrations');

export const incomingLogger = logger.section('Incoming WebHook');
export const outgoingLogger = logger.section('Outgoing WebHook');
