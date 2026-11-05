import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';

export type GroupsLeaveProps = GroupsBaseProps;

const GroupsLeavePropsSchema = withGroupBaseProperties();

export const isGroupsLeaveProps = ajv.compile<GroupsLeaveProps>(GroupsLeavePropsSchema);
