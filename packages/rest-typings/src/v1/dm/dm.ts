import type { ImEndpoints } from './im';

export type DmEndpoints = {
	'/v1/dm.messages.others': ImEndpoints['/v1/im.messages.others'];
	'/v1/dm.list': ImEndpoints['/v1/im.list'];
	'/v1/dm.list.everyone': ImEndpoints['/v1/im.list.everyone'];
};
