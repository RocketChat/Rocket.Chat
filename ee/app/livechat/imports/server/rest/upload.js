import { API } from '../../../../../../server/api/v1';
import { runEndpointsAsUser } from '../../../../livechat-enterprise/server/lib/runEndpointsAsUser';

const endpointsToRunAsUser = {
	'livechat/upload/:rid': ['post'],
};

runEndpointsAsUser({ originalAPIRoutes: API.v1._routes, endpointsToRunAsUser });
