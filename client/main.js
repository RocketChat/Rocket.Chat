import { setMinimumBrowserVersions } from 'meteor/modern-browsers';
import '/imports/startup/client';

setMinimumBrowserVersions({
	chrome: 49,
	firefox: 45,
	edge: 12,
	ie: Infinity, // Sorry, IE11.
	mobile_safari: [9, 2], // 9.2.0+
	opera: 36,
	safari: 9,
	electron: 1,
}, 'classes');
