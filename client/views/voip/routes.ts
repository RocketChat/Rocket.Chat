import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerVoIPRoutes = createRouteGroup('voip', '/voip', () => import('./VoIPRouter'));
