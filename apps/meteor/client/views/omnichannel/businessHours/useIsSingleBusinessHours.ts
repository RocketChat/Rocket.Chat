import { useEffectEvent } from '@rocket.chat/fuselage-hooks';

import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

export const useIsSingleBusinessHours = () =>
	useReactiveValue(useEffectEvent(() => businessHourManager.getTemplate())) === 'livechatBusinessHoursForm';
