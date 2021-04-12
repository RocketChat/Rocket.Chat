import { useTimezoneTime } from './useTimezoneTime';

export const useUTCClock = (utcOffset) => {
	const time = useTimezoneTime(utcOffset, 10000);
	return `${time} (UTC ${utcOffset})`;
};
