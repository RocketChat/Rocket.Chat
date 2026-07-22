import type { FederationMatrixTransaction, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFederationMatrixTransactionsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class FederationMatrixTransactionsRaw
  extends BaseRaw<FederationMatrixTransaction>
  implements IFederationMatrixTransactionsModel {
  constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<FederationMatrixTransaction>>) {
    super(db, 'federation_matrix_transactions', trash);
  }

  protected override modelIndexes(): IndexDescription[] {
    return [
      {
        key: {
          appServiceId: 1,
          senderId: 1,
          roomId: 1,
          eventType: 1,
          txnId: 1,
        },
        unique: true,
      },
    ];
  }

  findByTransaction(
    appServiceId: string,
    senderId: string,
    roomId: string,
    eventType: string,
    txnId: string,
  ) {
    return this.findOne({
      appServiceId,
      senderId,
      roomId,
      eventType,
      txnId,
    });
  }

  async createTransaction(
    transaction: Omit<FederationMatrixTransaction, '_id' | '_updatedAt'>,
  ): Promise<FederationMatrixTransaction> {
    const { insertedId } = await this.insertOne(transaction);

    const created = await this.findOneById(insertedId);

    if (!created) {
      throw new Error('Failed to load created FederationMatrixTransaction');
    }

    return created;
  }
}
