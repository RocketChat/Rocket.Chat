import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../../helpers/schemas';

export type ChannelsListProps = PaginatedRequest<null>;
const channelsListPropsSchema = {};
export const isChannelsListProps = ajv.compile<ChannelsListProps>(channelsListPropsSchema);
