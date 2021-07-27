import { API } from '../../../../../../app/api/server';
import { runEndpointsAsUser } from '../../../../livechat-enterprise/server/lib/runEndpointsAsUser';

const endpointsToRunAsUser = {
	'livechat/department': ['get', 'post'],
	'livechat/department/:_id': ['get', 'put', 'delete'],
};

runEndpointsAsUser({ originalAPIRoutes: API.v1._routes, endpointsToRunAsUser });
