import { Mongo } from 'meteor/mongo';

const Reports = new Mongo.Collection('rocketchat_reports');

export { Reports };
