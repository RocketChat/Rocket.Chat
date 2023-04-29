import { ajv } from '../../helpers/schemas';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

export type GroupsDeleteProps = GroupsBaseProps;

const GroupsDeletePropsSchema = withGroupBaseProperties();

export const isGroupsDeleteProps = ajv.compile<GroupsDeleteProps>(GroupsDeletePropsSchema);
