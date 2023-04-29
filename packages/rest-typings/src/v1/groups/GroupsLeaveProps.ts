import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../../helpers/schemas';

export type GroupsLeaveProps = GroupsBaseProps;

const GroupsLeavePropsSchema = withGroupBaseProperties();

export const isGroupsLeaveProps = ajv.compile<GroupsLeaveProps>(GroupsLeavePropsSchema);
