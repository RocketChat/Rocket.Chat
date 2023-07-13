import { lazy, useEffect } from 'react';

import { registerForm } from '../../../../client/views/omnichannel/additionalForms';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

declare module '../../../../client/views/omnichannel/additionalForms' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface EEFormHooks {
		useCustomFieldsAdditionalForm: () => typeof CustomFieldsAdditionalFormContainer;
		useMaxChatsPerAgent?: () => typeof MaxChatsPerAgentContainer;
		useMaxChatsPerAgentDisplay?: () => typeof MaxChatsPerAgentDisplay;
		useEeNumberInput?: () => typeof EeNumberInput;
		useEeTextAreaInput?: () => typeof EeTextAreaInput;
		useBusinessHoursMultiple?: () => typeof BusinessHoursMultipleContainer;
		useEeTextInput?: () => typeof EeTextInput;
		useBusinessHoursTimeZone?: () => typeof BusinessHoursTimeZone;
		useContactManager?: () => typeof ContactManager;
		useCurrentChatTags?: () => typeof CurrentChatTags;
		useDepartmentBusinessHours?: () => typeof DepartmentBusinessHours;
		useDepartmentForwarding?: () => typeof DepartmentForwarding;
		useSlaPoliciesSelect?: () => typeof SlaPoliciesSelect;
		usePrioritiesSelect?: () => typeof PrioritiesSelect;
		useSelectForwardDepartment?: () => typeof AutoCompleteDepartment;
	}
}

const CustomFieldsAdditionalFormContainer = lazy(() => import('../additionalForms/CustomFieldsAdditionalFormContainer'));
const MaxChatsPerAgentContainer = lazy(() => import('../additionalForms/MaxChatsPerAgentContainer'));
const MaxChatsPerAgentDisplay = lazy(() => import('../additionalForms/MaxChatsPerAgentDisplay'));
const EeNumberInput = lazy(() => import('../additionalForms/EeNumberInput'));
const EeTextAreaInput = lazy(() => import('../additionalForms/EeTextAreaInput'));
const BusinessHoursMultipleContainer = lazy(() => import('../additionalForms/BusinessHoursMultipleContainer'));
const EeTextInput = lazy(() => import('../additionalForms/EeTextInput'));
const BusinessHoursTimeZone = lazy(() => import('../additionalForms/BusinessHoursTimeZone'));
const ContactManager = lazy(() => import('../additionalForms/ContactManager'));
const CurrentChatTags = lazy(() => import('../tags/CurrentChatTags'));
const DepartmentBusinessHours = lazy(() => import('../additionalForms/DepartmentBusinessHours'));
const DepartmentForwarding = lazy(() => import('../additionalForms/DepartmentForwarding'));
const SlaPoliciesSelect = lazy(() => import('../additionalForms/SlaPoliciesSelect'));
const PrioritiesSelect = lazy(() => import('../additionalForms/PrioritiesSelect'));
const AutoCompleteDepartment = lazy(() => import('../../../../client/components/AutoCompleteDepartment'));

export const useLivechatEnterpriseAdditionalForms = () => {
	const licensed = useHasLicenseModule('livechat-enterprise') === true;

	useEffect(() => {
		if (!licensed) {
			return;
		}

		registerForm({
			useCustomFieldsAdditionalForm: () => CustomFieldsAdditionalFormContainer,
			useMaxChatsPerAgent: () => MaxChatsPerAgentContainer,
			useMaxChatsPerAgentDisplay: () => MaxChatsPerAgentDisplay,
			useEeNumberInput: () => EeNumberInput,
			useEeTextAreaInput: () => EeTextAreaInput,
			useBusinessHoursMultiple: () => BusinessHoursMultipleContainer,
			useEeTextInput: () => EeTextInput,
			useBusinessHoursTimeZone: () => BusinessHoursTimeZone,
			useContactManager: () => ContactManager,
			useCurrentChatTags: () => CurrentChatTags,
			useDepartmentBusinessHours: () => DepartmentBusinessHours,
			useDepartmentForwarding: () => DepartmentForwarding,
			useSlaPoliciesSelect: () => SlaPoliciesSelect,
			usePrioritiesSelect: () => PrioritiesSelect,
			useSelectForwardDepartment: () => AutoCompleteDepartment,
		});
	}, [licensed]);
};
