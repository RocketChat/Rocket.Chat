import { transferToNewAgent } from './Helper';

export const autoTransferVisitorJob = async ({ attrs: { data } }: any = {}): Promise<void> => {
	// TODO: remove this console log
	console.log('-------auto transfer job called', data);

	const { room, transferredBy } = data;

	await transferToNewAgent(room, transferredBy);
};
