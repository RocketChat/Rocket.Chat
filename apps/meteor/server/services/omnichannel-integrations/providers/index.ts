import type { ISMSProviderConstructor } from '@rocket.chat/core-typings';

import { Mobex } from './mobex';
import { Twilio } from './twilio';
import { Voxtelesys } from './voxtelesys';

export const registerSmsProviders = (register: (n: string, s: ISMSProviderConstructor) => void): void => {
	// @ts-expect-error TODO: investigate Mobex usability and why types differ
	register('mobex', Mobex);
	register('twilio', Twilio);
	register('voxtelesys', Voxtelesys);
};
