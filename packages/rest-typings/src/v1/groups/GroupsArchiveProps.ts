import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from './../Ajv';


export type GroupsArchiveProps = GroupsBaseProps;

const GroupsArchivePropsSchema = withGroupBaseProperties();

export const isGroupsArchiveProps = ajv.compile<GroupsArchiveProps>(GroupsArchivePropsSchema);
