import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';

export type GroupsSetAnnouncementProps = GroupsBaseProps & { announcement: string };
const groupsSetAnnouncementPropsSchema = withGroupBaseProperties(
	{
		announcement: {
			type: 'string',
		},
	},
	['announcement'],
);
export const isGroupsSetAnnouncementProps = ajv.compile<GroupsSetAnnouncementProps>(groupsSetAnnouncementPropsSchema);
