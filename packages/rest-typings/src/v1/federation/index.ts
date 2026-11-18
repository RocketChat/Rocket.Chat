export type FederationVerifyMatrixIdProps = {
	matrixIds: string[];
};

export type FederationEndpoints = {
	'/v1/federation/matrixIds.verify': {
		GET: (params: FederationVerifyMatrixIdProps) => { results: Record<string, string> };
	};
};
