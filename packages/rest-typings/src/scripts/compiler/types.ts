import type * as ts from 'typescript';

export type TypeNode = ts.TypeNode;
export type Node = ts.Node;
export type TypeChecker = ts.TypeChecker;
export type Type = ts.Type;
export type Program = ts.Program;
export type SourceFile = ts.SourceFile;

export interface IEndpointStructure {
	[apiPath: string]: {
		[methodName: string]: {
			params: any;
			response: any;
		};
	};
}

export interface IEndpoints {
	[filename: string]: IEndpointStructure;
}
