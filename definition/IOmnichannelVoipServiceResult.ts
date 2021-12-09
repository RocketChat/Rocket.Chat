export interface IAgentExtensionMap {
	_id: string;
	agentName: string;
	extension: string;
}

export interface IOmnichannelVoipServiceResult {
	result: string[] | IAgentExtensionMap[];
}
