import { callbacks } from '../../app/callbacks/lib/callbacks';
import { getConfig } from '../lib/utils/getConfig';

callbacks.setTimed([getConfig('debug'), getConfig('timed-callbacks')].includes('true'));
