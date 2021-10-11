import { callbacks } from '../../lib/callbacks';
import { Logger } from '../lib/logger/Logger';

(callbacks as any).logger = new Logger('Callbacks');
