import { RocketChat } from 'meteor/rocketchat:lib';
import { Mongo } from 'meteor/mongo';

RocketChat.models.WebdavAccounts = new Mongo.Collection('rocketchat_webdav_accounts');
