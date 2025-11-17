import type { ITimerProcessor } from '../../definition';

type TimeoutHandler = ReturnType<typeof setTimeout>;
type IntervalHandler = ReturnType<typeof setInterval>;

export const defaultTimerProcessor: ITimerProcessor<TimeoutHandler, IntervalHandler> = {
	setTimeout: (fn: () => void, timeout: number) => setTimeout(fn, timeout),
	clearTimeout: (handler: TimeoutHandler) => clearTimeout(handler),
	setInterval: (fn: () => void, interval: number) => setInterval(fn, interval),
	clearInterval: (handler: IntervalHandler) => clearInterval(handler),
};
