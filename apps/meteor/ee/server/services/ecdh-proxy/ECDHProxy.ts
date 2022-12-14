import { ServiceClass } from '@rocket.chat/core-sdk';

import './lib/server';

export class ECDHProxy extends ServiceClass {
	protected name = 'ecdh-proxy';
}
