import { Logger } from '@rocket.chat/logger';

export const integrationLogger = new Logger('Integrations');

export const incomingLogger = integrationLogger.section('Incoming WebHook');
export const outgoingLogger = integrationLogger.section('Outgoing WebHook');
