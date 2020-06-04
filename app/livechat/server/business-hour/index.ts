import { BusinessHourManager } from './BusinessHourManager';
import { SingleBusinessHour } from './Single';
import { LivechatBusinessHours } from '../../../models/server/raw/index';

export const businessHourManager = new BusinessHourManager(new SingleBusinessHour(LivechatBusinessHours));
