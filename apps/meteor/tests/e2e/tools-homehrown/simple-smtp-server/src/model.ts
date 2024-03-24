import { ParsedMail } from 'mailparser';

import { type InsertOneResult, type Collection, type WithId, MongoClient, type FindOptions } from 'mongodb';

type ParsedMailDocument = WithId<ParsedMail>;

class EmailsModel {
	private col!: Collection;

	private client!: Promise<MongoClient>;

	private _ready: boolean = false;

	constructor() {
		this.client = new MongoClient(String(process.env.MONGO_URL)).connect();

		this.client.then((client) => {
			this.col = client.db("tests").collection("emails_received");
		})
	}

	isready(): Promise<void> {
		if (this._ready) {
			return Promise.resolve();
		}

		return new Promise(resolve => this.client.then(() => {
			this._ready = true;
			resolve();
		}
		));
	}

	createNewEmail(email: ParsedMail): Promise<InsertOneResult> {
		return this.col.insertOne(email);
	}

	findBySubject(subject: string, options?: FindOptions<ParsedMail>) {
		return this.col.find<ParsedMailDocument>({ subject }, options ?? {});
	}

	fundByReceipientEmailAddress(address: string, options?: FindOptions<ParsedMail>) {
		return this.col.find<ParsedMailDocument>({ 'to.value.address': address }, options ?? {});
	}

	findByEmailContent(content: string, options?: FindOptions<ParsedMail>) {
		return this.col.find<ParsedMailDocument>({ text: content }, options ?? {});
	}
}

// always make sure connection is ready in case initial connect has a delay
export const Emails = new Proxy(new EmailsModel(), {
	get(target, prop: keyof EmailsModel) {
		const thing = target[prop];

		if (typeof thing !== 'function') {
			return thing;
		}

		return function(...args: any[]) {
			return new Promise(resolve => target.isready().then(() => {
				// @ts-ignore-error
				resolve(thing.apply(target, args));
			}));
		}

	}
});

