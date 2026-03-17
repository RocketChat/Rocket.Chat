import { ajv } from '../Ajv';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

export type GroupsArchiveProps = GroupsBaseProps;

const GroupsArchivePropsSchema = withGroupBaseProperties();

export const isGroupsArchiveProps = ajv.compile<GroupsArchiveProps>(GroupsArchivePropsSchema);
