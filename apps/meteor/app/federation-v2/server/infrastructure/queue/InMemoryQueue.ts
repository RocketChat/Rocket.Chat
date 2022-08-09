import fastq from 'fastq';

export class InMemoryQueue {
	private instance: any;

	public setHandler<C, T = any, R = any>(handler: fastq.asyncWorker<C, T, R>, concurrency: number): void {
		this.instance = fastq.promise(handler, concurrency);
	}

	public addToQueue(task: Record<string, any>): void {
		if (!this.instance) {
			throw new Error('You need to set the handler first');
		}
		this.instance.push(task).catch(console.error);
	}
}
