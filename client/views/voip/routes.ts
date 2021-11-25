import { createRouteGroup } from '../../lib/createRouteGroup';

console.log('asd');
export const registerVoIPRoutes = createRouteGroup('voip', '/voip', () => import('./VoIPRouter'));
