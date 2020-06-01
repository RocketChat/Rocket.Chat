export interface IRead {
	find(args: any[]): any[];
	findOneById(args: any[]): any;
	findOne(args: any[]): any;
}
