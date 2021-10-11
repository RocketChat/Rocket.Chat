import { callbacks } from '../../lib/callbacks';
import { getConfig } from '../lib/utils/getConfig';

callbacks.timed = [getConfig('debug'), getConfig('timed-callbacks')].includes('true');
