import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../Ajv';

export type GroupsConvertToTeamProps = GroupsBaseProps;

const GroupsConvertToTeamPropsSchema = withGroupBaseProperties();

export const isGroupsConvertToTeamProps = ajv.compile<GroupsConvertToTeamProps>(GroupsConvertToTeamPropsSchema);
