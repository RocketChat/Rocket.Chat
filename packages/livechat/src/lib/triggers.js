import mitt from 'mitt';

import { Livechat } from '../api';
import store from '../store';
import { actions } from './triggerActions';
import { conditions } from './triggerConditions';
import { hasTriggerCondition, isInIframe } from './triggerUtils';

class Triggers {
	/** @property {Triggers} instance*/

	/** @property {boolean} _started */

	/** @property {Array} _requests */

	/** @property {Array} _triggers */

	/** @property {boolean} _enabled */

	/** @property {import('mitt').Emitter} callbacks */

	constructor() {
		if (!Triggers.instance) {
			this._started = false;
			this._triggers = [];
			this._enabled = true;
			this.callbacks = mitt();
			Triggers.instance = this;
		}

		return Triggers.instance;
	}

	set triggers(newTriggers) {
		this._triggers = [...newTriggers];
	}

	set enabled(value) {
		this._enabled = value;
	}

	get parentUrl() {
		return isInIframe() ? store.state.parentUrl : window.location.href;
	}

	init() {
		if (this._started) {
			return;
		}

		const {
			token,
			config: { triggers },
		} = store.state;
		Livechat.credentials.token = token;

		if (!(triggers && triggers.length > 0)) {
			return;
		}

		this._started = true;

		this._triggers = triggers;

		this._listenParentUrlChanges();
	}

	when(id, condition) {
		if (!this._enabled) {
			return Promise.reject('Triggers disabled');
		}

		this._updateRecord(id, {
			status: 'scheduled',
			condition: condition.name,
		});

		return conditions[condition.name](condition);
	}

	async fire(id, action, params) {
		if (!this._enabled) {
			return Promise.reject('Triggers disabled');
		}

		await actions[action.name](action, params);
		this._updateRecord(id, { status: 'fired', action: action.name });
	}

	schedule(trigger) {
		const id = trigger._id;
		const [condition] = trigger.conditions;
		const [action] = trigger.actions;

		return this.when(id, condition).then((params) => this.fire(id, action, params));
	}

	scheduleAll(triggers) {
		const promises = triggers.map((trigger) => this.schedule(trigger));
		return Promise.all(promises);
	}

	async processTriggers({ force = false, filter = () => true } = {}) {
		const triggers = this._triggers.filter((trigger) => force || this._isValid(trigger)).filter(filter);

		try {
			await this.scheduleAll(triggers);
		} catch (error) {
			console.error(error);
		}
	}

	hasTriggeredMessages() {
		if (!this._triggers.length) {
			return false;
		}

		return this._findRecordsByStatus('scheduled').some((r) => r.condition !== 'after-guest-registration');
	}

	_listenParentUrlChanges() {
		store.on('change', ([state, prevState]) => {
			if (prevState.parentUrl !== state.parentUrl) {
				this.processTriggers({ force: true, filter: hasTriggerCondition('page-url') });
			}
		});
	}

	_isValid(trigger) {
		const record = this._findRecordById(trigger._id);
		return !trigger.runOnce || !record?.status === 'fired';
	}

	_updateRecord(id, data) {
		const { triggersRecords = {} } = store.state;
		const oldRecord = this._findRecordById(id);
		const newRecord = { ...oldRecord, id, ...data };

		store.setState({ triggersRecords: { ...triggersRecords, [id]: newRecord } });
	}

	_findRecordsByStatus(status) {
		const { triggersRecords = {} } = store.state;
		const records = Object.values(triggersRecords);

		return records.filter((e) => e.status === status);
	}

	_findRecordById(id) {
		const { triggersRecords = {} } = store.state;

		return triggersRecords[id];
	}
}

const instance = new Triggers();
export default instance;
