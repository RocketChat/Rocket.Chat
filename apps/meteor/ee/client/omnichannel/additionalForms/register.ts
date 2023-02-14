import type { LazyExoticComponent } from 'react';
import { useMemo, lazy } from 'react';

import type AutoCompleteDepartment from '../../../../client/components/AutoCompleteDepartment';
import { registerForm } from '../../../../client/views/omnichannel/additionalForms';
import { hasLicense } from '../../../app/license/client';
import type CurrentChatTags from '../tags/CurrentChatTags';
import type BusinessHoursMultipleContainer from './BusinessHoursMultipleContainer';
import type BusinessHoursTimeZone from './BusinessHoursTimeZone';
import type ContactManager from './ContactManager';
import type CustomFieldsAdditionalFormContainer from './CustomFieldsAdditionalFormContainer';
import type DepartmentBusinessHours from './DepartmentBusinessHours';
import type DepartmentForwarding from './DepartmentForwarding';
import type EeNumberInput from './EeNumberInput';
import type EeTextAreaInput from './EeTextAreaInput';
import type EeTextInput from './EeTextInput';
import type MaxChatsPerAgentContainer from './MaxChatsPerAgentContainer';
import type MaxChatsPerAgentDisplay from './MaxChatsPerAgentDisplay';
import type PrioritiesSelect from './PrioritiesSelect';

declare module '../../../../client/views/omnichannel/additionalForms' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface EEFormHooks {
		useCustomFieldsAdditionalForm: () => LazyExoticComponent<typeof CustomFieldsAdditionalFormContainer>;
		useMaxChatsPerAgent?: () => LazyExoticComponent<typeof MaxChatsPerAgentContainer>;
		useMaxChatsPerAgentDisplay?: () => LazyExoticComponent<typeof MaxChatsPerAgentDisplay>;
		useEeNumberInput?: () => LazyExoticComponent<typeof EeNumberInput>;
		useEeTextAreaInput?: () => LazyExoticComponent<typeof EeTextAreaInput>;
		useBusinessHoursMultiple?: () => LazyExoticComponent<typeof BusinessHoursMultipleContainer>;
		useEeTextInput?: () => LazyExoticComponent<typeof EeTextInput>;
		useBusinessHoursTimeZone?: () => LazyExoticComponent<typeof BusinessHoursTimeZone>;
		useContactManager?: () => LazyExoticComponent<typeof ContactManager>;

		useCurrentChatTags?: () => LazyExoticComponent<typeof CurrentChatTags>;
		useDepartmentBusinessHours?: () => LazyExoticComponent<typeof DepartmentBusinessHours>;
		useDepartmentForwarding?: () => LazyExoticComponent<typeof DepartmentForwarding>;
		usePrioritiesSelect?: () => LazyExoticComponent<typeof PrioritiesSelect>;
		useSelectForwardDepartment?: () => LazyExoticComponent<typeof AutoCompleteDepartment>;
	}
}

hasLicense('livechat-enterprise').then((enabled) => {
	if (!enabled) {
		return;
	}

	registerForm({
		useCustomFieldsAdditionalForm: () => useMemo(() => lazy(() => import('./CustomFieldsAdditionalFormContainer')), []),
		useMaxChatsPerAgent: () => useMemo(() => lazy(() => import('./MaxChatsPerAgentContainer')), []),
		useMaxChatsPerAgentDisplay: () => useMemo(() => lazy(() => import('./MaxChatsPerAgentDisplay')), []),
		useEeNumberInput: () => useMemo(() => lazy(() => import('./EeNumberInput')), []),
		useEeTextAreaInput: () => useMemo(() => lazy(() => import('./EeTextAreaInput')), []),
		useBusinessHoursMultiple: () => useMemo(() => lazy(() => import('./BusinessHoursMultipleContainer')), []),
		useEeTextInput: () => useMemo(() => lazy(() => import('./EeTextInput')), []),
		useBusinessHoursTimeZone: () => useMemo(() => lazy(() => import('./BusinessHoursTimeZone')), []),
		useContactManager: () => useMemo(() => lazy(() => import('./ContactManager')), []),
		useCurrentChatTags: () => useMemo(() => lazy(() => import('../tags/CurrentChatTags')), []),
		useDepartmentBusinessHours: () => useMemo(() => lazy(() => import('./DepartmentBusinessHours')), []),
		useDepartmentForwarding: () => useMemo(() => lazy(() => import('./DepartmentForwarding')), []),
		usePrioritiesSelect: () => useMemo(() => lazy(() => import('./PrioritiesSelect')), []),
		useSelectForwardDepartment: () => useMemo(() => lazy(() => import('../../../../client/components/AutoCompleteDepartment')), []),
	});
});
