import { useMemo, lazy } from 'react';

import { registerForm } from '../../../../client/omnichannel/additionalForms';

registerForm({ useCustomFieldsAdditionalForm: () => useMemo(() => lazy(() => import('./CustomFieldsAdditionalForm')), []) });
registerForm({ useMaxChatsPerAgent: () => useMemo(() => lazy(() => import('./MaxChatsPerAgent')), []) });
