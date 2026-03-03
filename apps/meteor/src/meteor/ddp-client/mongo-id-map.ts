import { MongoID } from 'meteor/mongo-id';
import { IdMap } from 'meteor/id-map';

export class MongoIDMap<T = any> extends IdMap<unknown, T> {
  constructor() {
    super(MongoID.idStringify, MongoID.idParse);
  }
}