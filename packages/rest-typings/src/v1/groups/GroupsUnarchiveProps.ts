import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from './../Ajv';


export type GroupsUnarchiveProps = GroupsBaseProps;

const GroupsUnarchivePropsSchema = withGroupBaseProperties();

export const isGroupsUnarchiveProps = ajv.compile<GroupsUnarchiveProps>(GroupsUnarchivePropsSchema);
