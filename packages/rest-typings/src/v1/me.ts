import type { MeEndpoints as MiscMeEndpoints } from '@rocket.chat/meteor/app/api/server/v1/misc';
import { ExtractRoutesFromAPI } from '@rocket.chat/rest-typings';

declare module '@rocket.chat/rest-typings' {
  interface Endpoints extends ExtractRoutesFromAPI<MiscMeEndpoints> {}
}

export {};
