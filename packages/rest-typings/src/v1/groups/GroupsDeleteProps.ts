import Ajv from 'ajv';

import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsDeleteProps = GroupsBaseProps;

const GroupsDeletePropsSchema = withGroupBaseProperties();

export const isGroupsDeleteProps = ajv.compile<GroupsDeleteProps>(GroupsDeletePropsSchema);
