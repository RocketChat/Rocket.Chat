import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../Ajv';

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
