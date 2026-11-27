import { License } from '@rocket.chat/license';

import { createManageAiAgentsPermissionWhenLicensed } from '../lib/ai-agents/permission';

await createManageAiAgentsPermissionWhenLicensed(License);
