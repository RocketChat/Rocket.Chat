export enum MatrixSendMessageType {
	'm.text',
}

export interface IMatrixEventContentSendMessage {
	body: string;
	msgtype: MatrixSendMessageType;
}
