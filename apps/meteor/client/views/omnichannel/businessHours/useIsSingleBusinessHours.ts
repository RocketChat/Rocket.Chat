import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';

// businessHourManager holds a single behavior instance with no reactive store — the previous
// useReactiveValue wrapper never actually re-ran, so this is a plain read.
export const useIsSingleBusinessHours = () => businessHourManager.getTemplate() === 'livechatBusinessHoursForm';
