import Ajv from 'ajv';

import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

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
