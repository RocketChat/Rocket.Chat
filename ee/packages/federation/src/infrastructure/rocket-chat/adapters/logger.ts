import { Logger } from '@rocket.chat/logger';
import type { BaseLogger } from 'pino';

const logger = new Logger('Federation_Matrix');

export const federationBridgeLogger: BaseLogger = logger.section('matrix_federation_bridge');
