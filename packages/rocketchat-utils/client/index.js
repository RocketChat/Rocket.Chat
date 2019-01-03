import { t, isRtl } from '../lib/tapi18n';
import { isChrome, isFirefox } from './lib/browsers';
import { getDefaultSubscriptionPref } from '../lib/getDefaultSubscriptionPref';
import { Info } from '../rocketchat.info';
import { handleError } from './lib/handleError';
import { getUserPreference } from '../lib/getUserPreference';

export {
	t,
	isRtl,
	isChrome,
	isFirefox,
	getDefaultSubscriptionPref,
	Info,
	handleError,
	getUserPreference,
};
