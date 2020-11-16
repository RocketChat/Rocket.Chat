import { useMemo, lazy } from 'react';

import { hasLicense } from '../../../app/license/client';
import { registerForm } from '../../../../client/omnichannel/additionalForms';

hasLicense('livechat-enterprise').then((enabled) => {
	if (!enabled) {
		return;
	}

	registerForm({ useCustomFieldsAdditionalForm: () => useMemo(() => lazy(() => import('./CustomFieldsAdditionalForm')), []) });
	registerForm({ useMaxChatsPerAgent: () => useMemo(() => lazy(() => import('./MaxChatsPerAgent')), []) });
	registerForm({ useMaxChatsPerAgentDisplay: () => useMemo(() => lazy(() => import('./MaxChatsPerAgentDisplay')), []) });
	registerForm({ useEeNumberInput: () => useMemo(() => lazy(() => import('./EeNumberInput')), []) });
	registerForm({ useEeTextAreaInput: () => useMemo(() => lazy(() => import('./EeTextAreaInput')), []) });
	registerForm({ useEeTextInput: () => useMemo(() => lazy(() => import('./EeTextInput')), []) });
	registerForm({ useDepartmentForwarding: () => useMemo(() => lazy(() => import('./DepartmentForwarding')), []) });
	registerForm({ useDepartmentBusinessHours: () => useMemo(() => lazy(() => import('./DepartmentBusinessHours')), []) });
	registerForm({ useCustomFieldsAdditionalForm: () => useMemo(() => lazy(() => import('./CustomFieldsAdditionalForm')), []) });
	registerForm({ useBusinessHoursTimeZone: () => useMemo(() => lazy(() => import('./BusinessHoursTimeZone')), []) });
	registerForm({ useBusinessHoursMultiple: () => useMemo(() => lazy(() => import('./BusinessHoursMultiple')), []) });
	registerForm({ useCurrentChatTags: () => useMemo(() => lazy(() => import('../tags/CurrentChatTags')), []) });
});
