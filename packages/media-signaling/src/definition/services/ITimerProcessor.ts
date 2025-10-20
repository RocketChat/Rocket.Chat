export interface ITimerProcessor<TimeoutHandler, IntervalHandler> {
	setTimeout(fn: () => void, timeout: number): TimeoutHandler;
	clearTimeout(handler: TimeoutHandler): void;

	setInterval(fn: () => void, interval: number): IntervalHandler;
	clearInterval(handler: IntervalHandler): void;
}
