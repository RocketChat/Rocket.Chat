import { LoggerManager } from './server';
import { Logger } from '../../../server/lib/logger';
import './streamer';

const SystemLogger = new Logger('System');

export {
	LoggerManager,
	Logger,
	SystemLogger,
};
