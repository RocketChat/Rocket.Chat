import { API } from '../../../../../../server/api/v1';
import { runEndpointsAsUser } from '../../../../livechat-enterprise/server/lib/runEndpointsAsUser';

const endpointsToRunAsUser = {
	'livechat/department': ['get', 'post'],
	'livechat/department/:_id': ['get', 'put', 'delete'],
};

runEndpointsAsUser({ originalAPIRoutes: API.v1._routes, endpointsToRunAsUser });
