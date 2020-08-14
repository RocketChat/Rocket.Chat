import { callbacks } from '../../../../../app/callbacks';
import { onLicense } from '../../../license/server';

let valid = false;
onLicense('livechat-enterprise', () => {
	valid = true;
});
onLicense('omnichannel-mobile-enterprise', () => {
	valid = true;
});

callbacks.add('beforeShouldNotifyMobile', (options) => (options.roomType !== 'l' || valid ? options : false), callbacks.priority.HIGH, 'beforeShouldNotifyMobile-enterprise');
