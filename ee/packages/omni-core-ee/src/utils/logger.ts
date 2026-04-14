import { Logger } from '@rocket.chat/logger';

export const defaultLogger = new Logger('OmniCore-ee');
export const hooksLogger = defaultLogger.section('hooks');
