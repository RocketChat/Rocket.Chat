export interface IOmnichannelQueue {
	start(): Promise<void>;
	shouldStart(): Promise<void>;
	stop(): Promise<void>;
	isRunning(): boolean;
}
