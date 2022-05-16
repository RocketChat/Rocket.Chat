import type { ImEndpoints } from './im';

export type DmEndpoints = {
	'dm.create': ImEndpoints['im.create'];
	'dm.delete': ImEndpoints['im.delete'];
	'dm.close': ImEndpoints['im.close'];
	'dm.counters': ImEndpoints['im.counters'];
	'dm.files': ImEndpoints['im.files'];
	'dm.history': ImEndpoints['im.history'];
	'dm.members': ImEndpoints['im.members'];
	'dm.messages': ImEndpoints['im.messages'];
	'dm.messages.others': ImEndpoints['im.messages.others'];
	'dm.list': ImEndpoints['im.list'];
	'dm.list.everyone': ImEndpoints['im.list.everyone'];
	'dm.open': ImEndpoints['im.open'];
	'dm.setTopic': ImEndpoints['im.setTopic'];
};
