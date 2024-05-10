import type { IMethodThisType } from './IMethodThisType';

export interface IMethodType {
	[key: string]: (this: IMethodThisType, ...args: any[]) => any;
}
