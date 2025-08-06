import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from './../Ajv';


export type GroupsRolesProps = GroupsBaseProps;

const GroupsRolesPropsSchema = withGroupBaseProperties();

export const isGroupsRolesProps = ajv.compile<GroupsRolesProps>(GroupsRolesPropsSchema);
