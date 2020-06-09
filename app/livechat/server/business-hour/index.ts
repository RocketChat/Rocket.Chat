import { BusinessHourManager } from './BusinessHourManager';
import { SingleBusinessHour } from './Single';
import { LivechatBusinessHours } from '../../../models/server/raw/index';
import { cronJobs } from '../../../utils/server/lib/cron/Cronjobs';

export const businessHourManager = new BusinessHourManager(new SingleBusinessHour(LivechatBusinessHours), cronJobs);
