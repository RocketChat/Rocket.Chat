export declare class Base<T> {
	model: any;

	constructor(nameOrModel: string);

	tryEnsureIndex(...args: any[]): any;

	findOne(...args: any[]): T;

	insert(item: T): string;

	update(...args: any[]): any;

	upsert(...args: any[]): any;
}
