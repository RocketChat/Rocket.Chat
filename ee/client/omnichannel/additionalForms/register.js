import { useMemo, lazy } from 'react';

import { registerForm } from '../../../../client/omnichannel/additionalForms';

registerForm({ useCustomFieldsAdditionalForm: () => useMemo(() => lazy(() => import('./CustomFieldsAdditionalForm')), []) });
registerForm({ useBusinessHoursTimeZone: () => useMemo(() => lazy(() => import('./BusinessHoursTimeZone')), []) });
