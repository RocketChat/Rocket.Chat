import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from './../Ajv';


export type GroupsGetIntegrationsProps = GroupsBaseProps & { includeAllPrivateGroups?: 'true' | 'false' | 1 | 0 };
const groupsGetIntegrationPropsSchema = withGroupBaseProperties({
	includeAllPrivateGroups: {
		type: 'string',
		nullable: true,
	},
});
export const isGroupsGetIntegrationsProps = ajv.compile<GroupsGetIntegrationsProps>(groupsGetIntegrationPropsSchema);
