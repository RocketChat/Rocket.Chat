import { addBaseMiddlewares } from './httpServer';
import { forceSsl, securityHeaders } from '../cors/cors';
import { instanceIdHeader } from '../debug';

addBaseMiddlewares(forceSsl, instanceIdHeader, securityHeaders);
