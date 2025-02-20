export class LogOperation {
	private records: (Record<string, any> | LogOperation)[] = [];

	private ts = new Date();

	public isData = false;

	constructor(
		private name: string,
		data?: string | Record<string, any>,
	) {
		if (data) {
			this.addRecord(data);
		}
	}

	public addRecord(data: string | Record<string, any>): void {
		this.records.push({
			ts: new Date().toISOString(),
			...(typeof data === 'string' ? { msg: data } : data),
		});
	}

	public addOperation(name: string, data?: string | Record<string, any>): LogOperation {
		const operation = new LogOperation(name, data);
		this.records.push(operation);
		return operation;
	}

	public addDataOperation(name: string, data?: string | Record<string, any>): LogOperation {
		const op = this.addOperation(name, data);
		op.isData = true;

		return op;
	}

	public toJSON(): Record<string, any> {
		return {
			ts: this.ts,
			name: this.name,
			records: this.records,
		};
	}

	public purgeData(): void {
		if (this.isData) {
			this.records = [];
			return;
		}

		for (const record of this.records) {
			if (record instanceof LogOperation) {
				record.purgeData();
			}
		}
	}
}
