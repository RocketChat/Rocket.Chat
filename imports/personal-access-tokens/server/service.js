import { applyMeteorMixin } from '../../services/utils';
import actions from './api/actions';
export default {
	version: 1,
	settings: {
		$noVersionPrefix: true,
	},
	name: 'personalAccessTokens',
	mixins: [applyMeteorMixin()], // TODO remove
	actions,
};
