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
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface EEFormHooks {
		useCustomFieldsAdditionalForm: () => React.LazyExoticComponent<typeof CustomFieldsAdditionalFormContainer>;
		useMaxChatsPerAgent?: () => React.LazyExoticComponent<typeof MaxChatsPerAgentContainer>;
		useMaxChatsPerAgentDisplay?: () => React.LazyExoticComponent<typeof MaxChatsPerAgentDisplay>;
		useEeNumberInput?: () => React.LazyExoticComponent<typeof EeNumberInput>;
		useEeTextAreaInput?: () => React.LazyExoticComponent<typeof EeTextAreaInput>;
		useBusinessHoursMultiple?: () => React.LazyExoticComponent<typeof BusinessHoursMultipleContainer>;
		useEeTextInput?: () => React.LazyExoticComponent<typeof EeTextInput>;
		useBusinessHoursTimeZone?: () => React.LazyExoticComponent<typeof BusinessHoursTimeZone>;
		useContactManager?: () => React.LazyExoticComponent<typeof ContactManager>;

		useCurrentChatTags?: () => React.LazyExoticComponent<typeof CurrentChatTags>;
		useDepartmentBusinessHours?: () => React.LazyExoticComponent<typeof DepartmentBusinessHours>;
		useDepartmentForwarding?: () => React.LazyExoticComponent<typeof DepartmentForwarding>;
		usePrioritiesSelect?: () => React.LazyExoticComponent<typeof PrioritiesSelect>;
		useSelectForwardDepartment?: () => React.LazyExoticComponent<typeof AutoCompleteDepartment>;
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
