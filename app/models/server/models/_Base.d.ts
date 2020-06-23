export declare class Base<T> {
	model: any;

	constructor(nameOrModel: string);

	tryEnsureIndex(...args: any[]): any;

	find(...args: any[]): any;

	findOne(...args: any[]): T;

	insert(item: T, ...args: any[]): string;

	update(...args: any[]): any;

	upsert(...args: any[]): any;

	setUpdatedAt(record: any): any;
}
