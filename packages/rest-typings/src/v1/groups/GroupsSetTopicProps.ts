import Ajv from 'ajv';

import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

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
