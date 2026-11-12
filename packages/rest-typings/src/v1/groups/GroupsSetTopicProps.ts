import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';

export type GroupsSetTopicProps = GroupsBaseProps & { topic: string };
const groupsSetTopicPropsSchema = withGroupBaseProperties(
	{
		topic: {
			type: 'string',
		},
	},
	['topic'],
);
export const isGroupsSetTopicProps = ajv.compile<GroupsSetTopicProps>(groupsSetTopicPropsSchema);
