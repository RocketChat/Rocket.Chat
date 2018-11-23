import { applyMeteorMixin } from '../../services/utils';
import actions from './api/actions';
export default {
	version: 1,
	settings: {
		$noVersionPrefix: true,
	},
	name: 'messageReadReceipt',
	mixins: [applyMeteorMixin()], // TODO remove
	actions,
};
