import { useMemo, lazy } from 'react';

import { registerForm } from '../../../../client/omnichannel/additionalForms';

registerForm({ useCustomFieldsAdditionalForm: () => useMemo(() => lazy(() => import('./CustomFieldsAdditionalForm')), []) });
