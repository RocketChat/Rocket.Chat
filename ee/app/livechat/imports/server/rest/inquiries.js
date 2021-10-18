import { API } from '../../../../../../app/api/server';
import { runEndpointsAsUser } from '../../../../livechat-enterprise/server/lib/runEndpointsAsUser';

const endpointsToRunAsUser = {
	'livechat/inquiries.list': ['get'],
};

runEndpointsAsUser({ originalAPIRoutes: API.v1._routes, endpointsToRunAsUser });
