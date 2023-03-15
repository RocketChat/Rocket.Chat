import Ajv from 'ajv';

import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsCountersProps = GroupsBaseProps;

const GroupsCountersPropsSchema = withGroupBaseProperties();

export const isGroupsCountersProps = ajv.compile<GroupsCountersProps>(GroupsCountersPropsSchema);
