import { useTimezoneTime } from './useTimezoneTime';

export const useUTCClock = (utcOffset: number): string => {
	const time = useTimezoneTime(utcOffset, 10000);
	return `${time} (UTC ${utcOffset})`;
};
