import { types } from 'mediasoup';

export interface ICreateProducerData extends types.ProducerOptions {
	transportId: string;
}
