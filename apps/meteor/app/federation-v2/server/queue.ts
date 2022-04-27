// Create the queue
import { queueAsPromised } from 'fastq';
import * as fastq from 'fastq';

import { IMatrixEvent } from './definitions/IMatrixEvent';
import { MatrixEventType } from './definitions/MatrixEventType';
import { eventHandler } from './eventHandler';

export const matrixEventQueue: queueAsPromised<IMatrixEvent<MatrixEventType>> = fastq.promise(eventHandler, 1);

export const addToQueue = (event: IMatrixEvent<MatrixEventType>): void => {
	console.log(`Queueing ${event.type}...`);

	// TODO: Handle error
	matrixEventQueue.push(event).catch((err) => console.error(err));
};
