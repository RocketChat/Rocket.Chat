import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';

export type GroupsGetIntegrationsProps = GroupsBaseProps & { includeAllPrivateGroups?: 'true' | 'false' | 1 | 0 };
const groupsGetIntegrationPropsSchema = withGroupBaseProperties({
	includeAllPrivateGroups: {
		type: 'string',
		nullable: true,
	},
});
export const isGroupsGetIntegrationsProps = ajv.compile<GroupsGetIntegrationsProps>(groupsGetIntegrationPropsSchema);
