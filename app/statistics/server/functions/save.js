import { Statistics } from '../../../models';
import { statistics } from '../../lib/rocketchat';

statistics.save = function() {
	const rcStatistics = statistics.get();
	rcStatistics.createdAt = new Date;
	Statistics.insert(rcStatistics);
	return rcStatistics;
};
