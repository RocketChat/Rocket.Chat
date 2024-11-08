export interface IInternalRPCServiceRegistrar {
	registerAction<TInput, TOutput>(action: string, handler: (input: TInput) => Promise<TOutput>): Promise<void>;
}

export interface IInternalRPCAdapter {
	createRPCService(serviceName: string): Promise<IInternalRPCServiceRegistrar>;
	deleteRPCService(serviceName: string): Promise<void>;
}
