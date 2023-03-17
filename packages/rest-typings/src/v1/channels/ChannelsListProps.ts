import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChannelsListProps = PaginatedRequest<null>;
const channelsListPropsSchema = {};
export const isChannelsListProps = ajv.compile<ChannelsListProps>(channelsListPropsSchema);
