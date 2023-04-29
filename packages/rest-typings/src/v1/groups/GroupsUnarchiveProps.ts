import { ajv } from '../../helpers/schemas';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

export type GroupsUnarchiveProps = GroupsBaseProps;

const GroupsUnarchivePropsSchema = withGroupBaseProperties();

export const isGroupsUnarchiveProps = ajv.compile<GroupsUnarchiveProps>(GroupsUnarchivePropsSchema);
