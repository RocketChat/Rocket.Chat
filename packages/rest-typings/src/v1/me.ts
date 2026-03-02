import type { IMeResponse } from '@rocket.chat/rest-api/server/misc';
import { ExtractRoutesFromAPI } from '@rocket.chat/rest-typings';
import type { MeEndpoints as MiscMeEndpoints } from '@rocket.chat/rest-api/server/misc';

declare module '@rocket.chat/rest-typings' {
  interface Endpoints extends ExtractRoutesFromAPI<MiscMeEndpoints> {}
}

export {};
