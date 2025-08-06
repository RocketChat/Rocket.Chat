import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from './../Ajv';


export type GroupsDeleteProps = GroupsBaseProps;

const GroupsDeletePropsSchema = withGroupBaseProperties();

export const isGroupsDeleteProps = ajv.compile<GroupsDeleteProps>(GroupsDeletePropsSchema);
