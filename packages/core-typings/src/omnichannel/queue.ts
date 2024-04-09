export interface IOmnichannelQueue {
	start(): Promise<void>;
	shouldStart(): void;
	stop(): Promise<void>;
	isRunning(): boolean;
	execute(): Promise<void>;
}
