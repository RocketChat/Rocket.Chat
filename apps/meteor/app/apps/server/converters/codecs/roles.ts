import type { IRole } from '@rocket.chat/core-typings';

import { createMappedCodec } from './mappedData';

/**
 * Rocket.Chat `IRole` <-> Apps-Engine role.
 *
 * A pure field-rename with an `_unmappedProperties_` bucket, so it is expressed directly via
 * {@link createMappedCodec}. Keys are the Apps-Engine names, values the Rocket.Chat names (checked
 * against `keyof IRole`).
 */
export const RoleCodec = createMappedCodec<IRole>({
	id: '_id',
	name: 'name',
	description: 'description',
	mandatory2fa: 'mandatory2fa',
	protected: 'protected',
	scope: 'scope',
});
