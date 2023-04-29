import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../../helpers/schemas';

export type GroupsRolesProps = GroupsBaseProps;

const GroupsRolesPropsSchema = withGroupBaseProperties();

export const isGroupsRolesProps = ajv.compile<GroupsRolesProps>(GroupsRolesPropsSchema);
