export declare class Base {
	model: any;

	constructor(nameOrModel: string);

	tryEnsureIndex(...args: any[]): any;

	findOne(...args: any[]): any;

	static findOne(...args: any[]): any;

	insert(...args: any[]): any;

	static insert(...args: any[]): any;

	update(...args: any[]): any;

	static update(...args: any[]): any;
}
