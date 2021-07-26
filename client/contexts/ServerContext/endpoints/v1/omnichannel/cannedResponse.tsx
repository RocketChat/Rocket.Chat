import { IOmnichannelCannedResponse } from '../../../../../../definition/IOmnichannelCannedResponse';

export type CannedResponseEndpointGetReturn = {
	cannedResponse: IOmnichannelCannedResponse;
	success: boolean;
};

export type CannedResponseEndpoint = {
	GET: () => CannedResponseEndpointGetReturn;
};
