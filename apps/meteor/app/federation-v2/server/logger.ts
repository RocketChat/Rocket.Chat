import { Logger } from '../../logger/server';

const logger = new Logger('Federation_Matrix');

export const bridgeLogger = logger.section('bridge');
export const setupLogger = logger.section('setup');
