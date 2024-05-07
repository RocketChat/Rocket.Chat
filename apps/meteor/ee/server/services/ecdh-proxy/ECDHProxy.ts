import { ServiceClass } from '@rocket.chat/core-services';

import './lib/server';

export class ECDHProxy extends ServiceClass {
	protected name = 'ecdh-proxy';
}
