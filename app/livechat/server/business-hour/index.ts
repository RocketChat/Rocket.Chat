import { BusinessHourManager } from './BusinessHourManager';
import { SingleBusinessHour } from './Single';
import { cronJobs } from '../../../utils/server/lib/cron/Cronjobs';

export const businessHourManager = new BusinessHourManager(new SingleBusinessHour(), cronJobs);
