import { useMemo, lazy } from 'react';

import { registerForm } from '../../../../client/views/omnichannel/additionalForms';
import { hasLicense } from '../../../app/license/client';

hasLicense('livechat-enterprise').then((enabled) => {
	if (!enabled) {
		return;
	}

	registerForm({
		useCustomFieldsAdditionalForm: () =>
			useMemo(() => lazy(() => import('./CustomFieldsAdditionalFormContainer')), []),
	});
	registerForm({
		useMaxChatsPerAgent: () => useMemo(() => lazy(() => import('./MaxChatsPerAgentContainer')), []),
	});
	registerForm({
		useMaxChatsPerAgentDisplay: () =>
			useMemo(() => lazy(() => import('./MaxChatsPerAgentDisplay')), []),
	});
	registerForm({
		useEeNumberInput: () => useMemo(() => lazy(() => import('./EeNumberInput')), []),
	});
	registerForm({
		useEeTextAreaInput: () => useMemo(() => lazy(() => import('./EeTextAreaInput')), []),
	});
	registerForm({ useEeTextInput: () => useMemo(() => lazy(() => import('./EeTextInput')), []) });
	registerForm({
		useBusinessHoursMultiple: () =>
			useMemo(() => lazy(() => import('./BusinessHoursMultipleContainer')), []),
	});
	registerForm({
		useBusinessHoursTimeZone: () =>
			useMemo(() => lazy(() => import('./BusinessHoursTimeZone')), []),
	});
	registerForm({
		useContactManager: () => useMemo(() => lazy(() => import('./ContactManager')), []),
	});
	registerForm({
		useCurrentChatTags: () => useMemo(() => lazy(() => import('../tags/CurrentChatTags')), []),
	});
	registerForm({
		useDepartmentBusinessHours: () =>
			useMemo(() => lazy(() => import('./DepartmentBusinessHours')), []),
	});
	registerForm({
		useDepartmentForwarding: () => useMemo(() => lazy(() => import('./DepartmentForwarding')), []),
	});
	registerForm({
		usePrioritiesSelect: () => useMemo(() => lazy(() => import('./PrioritiesSelect')), []),
	});
});
