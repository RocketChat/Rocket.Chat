import { Subscriptions as SubscriptionsRaw } from '../../../models/server/raw';
import { Subscriptions } from '../../../models';

export class AppRoomSubscriptionBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async testingIt() {
		console.log('awaited inside of for loop');
		for (const thing of await this.getByRoomId('GENERAL', 'fake3')) {
			console.log('thing', thing);
		}
	}

	async getByRoomId(roomId, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the room subscriptions by the room id: "${ roomId }"`);
		const orcha = this.orch;
		const totalCount = await SubscriptionsRaw.countByRoomId(roomId);

		return {
			[Symbol.iterator]: function getSubscriptionsByRoomIdIterator() {
				let exhausted = false;
				let currentIndex = 0;

				console.log('inside of the iterator function with a count of:', totalCount);

				return {
					next() {
						console.log('inside the iterator\'s next() function');
						// currentIndex will always be 0 based whereas count is always 1 based.
						// so we check if it is equal to or greater than the total count
						// and if so, then we are done with this iteration
						if (currentIndex >= totalCount || exhausted) {
							return {
								value: undefined,
								done: true,
							};
						}

						// We skip the current index because if it is the first time, then we skip zero
						// if it is the second time then we skip one, and so on and so forth
						const options = { limit: 1, sort: { ts: 1 }, skip: currentIndex };

						console.log('running the query');
						const result = Subscriptions.findByRoomId(roomId, options).fetch();

						console.log('got the result', result);
						if (!result || result.length !== 1) {
							return {
								value: undefined,
								done: true,
							};
						}

						currentIndex++;
						return {
							value: orcha.getConverters().get('roomSubscriptions').convertSubscriptionToApp(result[0]),
							done: false,
						};
					},
					throw(e) {
						console.log('oops something is wrong');
						throw e;
					},
					return() {
						exhausted = true;
						console.log('I have been released !!!');
						return {
							value: undefined,
							done: true,
						};
					},
				};
			},
		};
	}

	async getByUserId(userId, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the room subscriptions by the user id: "${ userId }"`);
		const orcha = this.orch;
		const totalCount = await SubscriptionsRaw.countByUserId(userId);

		return {
			[Symbol.iterator]: function getSubscriptionsByUserIdIterator() {
				let currentIndex = 0;

				return {
					next() {
						// currentIndex will always be 0 based whereas count is always 1 based.
						// so we check if it is equal to or greater than the total count
						// and if so, then we are done with this iteration
						if (currentIndex >= totalCount) {
							return {
								value: undefined,
								done: true,
							};
						}

						// We skip the current index because if it is the first time, then we skip zero
						// if it is the second time then we skip one, and so on and so forth
						const options = { limit: 1, sort: { ts: 1 }, skip: currentIndex };
						const result = Subscriptions.findByUserId(userId, options).fetch();

						// We only expect one result, so let's error on the safe side if another count comes back
						if (result.length !== 1) {
							return {
								value: undefined,
								done: true,
							};
						}

						currentIndex++;
						return {
							value: orcha.getConverters().get('roomSubscriptions').convertSubscriptionToApp(result[0]),
							done: false,
						};
					},
				};
			},
		};
	}
}
