import type { FederationMatrixTransaction } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IFederationMatrixTransactionsModel extends IBaseModel<FederationMatrixTransaction> {
  findByTransaction(
    appServiceId: string,
    senderId: string,
    roomId: string,
    eventType: string,
    txnId: string,
  ): Promise<FederationMatrixTransaction | null>;

  createTransaction(
    transaction: Omit<FederationMatrixTransaction, '_id' | '_updatedAt'>,
  ): Promise<FederationMatrixTransaction>;
}