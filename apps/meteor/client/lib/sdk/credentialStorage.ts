import { LocalStorageCredentialStorage } from '@rocket.chat/ddp-client';

/**
 * Single shared `CredentialStorage` instance used across the meteor app
 * client. Pulled out of `ddpSdk.ts` so utility modules
 * (`storedCredentials.ts`, hooks, helpers) can hit the storage without
 * having to call `getDdpSdk()` — which would create a circular import
 * between `storedCredentials.ts` and `ddpSdk.ts`.
 *
 * Both `AccountImpl` (real DDPSDK transport) and `createMeteorBackedAccount`
 * (Meteor pass-through) take an instance of this class so reads and writes
 * land on the exact same `localStorage.Meteor.loginToken` slot Meteor
 * already uses.
 */
export const credentialStorage = new LocalStorageCredentialStorage();
