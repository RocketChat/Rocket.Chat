import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../../helpers/schemas';

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
