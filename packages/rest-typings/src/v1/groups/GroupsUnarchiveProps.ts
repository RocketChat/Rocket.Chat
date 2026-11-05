import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';

export type GroupsUnarchiveProps = GroupsBaseProps;

const GroupsUnarchivePropsSchema = withGroupBaseProperties();

export const isGroupsUnarchiveProps = ajv.compile<GroupsUnarchiveProps>(GroupsUnarchivePropsSchema);
