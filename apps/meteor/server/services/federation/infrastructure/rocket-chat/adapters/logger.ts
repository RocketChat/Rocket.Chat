import { Logger } from '@rocket.chat/logger';

const logger = new Logger('Federation_Matrix');

export const federationBridgeLogger = logger.section('matrix_federation_bridge');
