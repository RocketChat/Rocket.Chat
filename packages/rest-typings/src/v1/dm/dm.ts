import type { ImEndpoints } from './im';

// Public mirror of the implementation-derived routes (apps/meteor/server/api/v1/im.ts,
// `ExtractRoutesFromAPI<typeof dmEndpoints>`). Each dm.* route shares its endpoint props with
// the im.* counterpart, so it is typed by reference; kept identical so the two declarations merge
// without TS2320, and so SDK/external consumers that don't compile apps/meteor keep these routes.
export type DmEndpoints = {
	'/v1/dm.create': ImEndpoints['/v1/im.create'];
	'/v1/dm.delete': ImEndpoints['/v1/im.delete'];
	'/v1/dm.close': ImEndpoints['/v1/im.close'];
	'/v1/dm.leave': ImEndpoints['/v1/im.leave'];
	'/v1/dm.open': ImEndpoints['/v1/im.open'];
	'/v1/dm.setTopic': ImEndpoints['/v1/im.setTopic'];
	'/v1/dm.blockUser': ImEndpoints['/v1/im.blockUser'];
	'/v1/dm.counters': ImEndpoints['/v1/im.counters'];
	'/v1/dm.files': ImEndpoints['/v1/im.files'];
	'/v1/dm.members': ImEndpoints['/v1/im.members'];
	'/v1/dm.messages': ImEndpoints['/v1/im.messages'];
	'/v1/dm.history': ImEndpoints['/v1/im.history'];
	'/v1/dm.messages.others': ImEndpoints['/v1/im.messages.others'];
	'/v1/dm.list': ImEndpoints['/v1/im.list'];
	'/v1/dm.list.everyone': ImEndpoints['/v1/im.list.everyone'];
};
