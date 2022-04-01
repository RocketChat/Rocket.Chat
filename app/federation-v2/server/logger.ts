import { Logger } from '../../logger/server';

const logger = new Logger('FederationV2');

export const bridgeLogger = logger.section('bridge');
export const setupLogger = logger.section('setup');
