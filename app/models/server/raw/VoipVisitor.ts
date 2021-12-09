
import { FindOneOptions, UpdateQuery, WriteOpResult } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';
import { IVisitor } from '../../../../definition/IVisitor';
import { Settings } from '.';

type T = IVisitor;
export class VoipVisitorRaw extends BaseRaw<T> {
	getVisitorByToken(token: string, options: FindOneOptions<T> = {}): Promise<T | null> {
		const query = {
			token,
		};

		return this.findOne(query, options);
	}

	findOneById(_id: string, options: FindOneOptions<T> = {}): Promise<T | null> {
		const query = {
			_id,
		};
		return this.findOne(query, options);
	}

	findOneGuestByEmailAddress(emailAddress: string): Promise<T|null> {
		const query = {
			'visitorEmails.address': new RegExp(`^${ escapeRegExp(emailAddress) }$`, 'i'),
		};

		return this.findOne(query);
	}

	async getNextVisitorUsername(): Promise<string> {
		const query = {
			_id: 'Livechat_guest_count',
		};

		const update = {
			$inc: {
				value: 1,
			},
		};

		const livechatCount = await Settings.findAndModify(query, update);
		if (livechatCount && livechatCount.value && livechatCount.value.value) {
			const count = livechatCount.value.value;
			return `guest-${ Number(count) + 1 }`;
		}
		return Promise.resolve('');
	}

	async insert(args: IVisitor): Promise<any> {
		const result = await this.insertOne(args);
		return result.insertedId;
	}

	updateById(_id: any, update: UpdateQuery<T> | Partial<T>): Promise<WriteOpResult> {
		return this.update({ _id }, update);
	}
}
