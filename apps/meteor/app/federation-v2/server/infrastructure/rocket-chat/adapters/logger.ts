import { Logger } from '../../../../../logger/server';

const logger = new Logger('Federation_Matrix');

export const federationBridgeLogger = logger.section('matrix_federation_bridge');
export const federationSetupLogger = logger.section('matrix_federation_setup');
