import { ajv } from '../../helpers/schemas';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

export type GroupsConvertToTeamProps = GroupsBaseProps;

const GroupsConvertToTeamPropsSchema = withGroupBaseProperties();

export const isGroupsConvertToTeamProps = ajv.compile<GroupsConvertToTeamProps>(GroupsConvertToTeamPropsSchema);
