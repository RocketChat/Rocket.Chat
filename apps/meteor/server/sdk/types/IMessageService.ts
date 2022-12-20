export interface IMessageService {
	createDirectMessage(data: { to: string; from: string }): Promise<{ rid: string }>;
}
