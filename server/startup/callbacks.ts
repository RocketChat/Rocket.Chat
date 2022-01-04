import { callbacks } from '../../app/callbacks/lib/callbacks';
import { Logger } from '../lib/logger/Logger';

callbacks.setLogger(new Logger('Callbacks'));
