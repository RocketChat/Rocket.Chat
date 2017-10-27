class HelpRequest extends RocketChat.models._Base {
	constructor() {
		super('helpRequest');
		if (Meteor.isClient) {
			this._initModel('helpRequest');
		}

		this.tryEnsureIndex({'roomId': 1}, {unique: 1, sparse: 1});
		this.tryEnsureIndex({'supportArea': 1});
	}

	//-------------------------- FIND ONE
	findOneById(_id, options) {
		const query = {_id};
		return this.findOne(query, options);
	}

	findOneByRoomId(roomId, options) {
		const query = {roomId};
		return this.findOne(query, options);
	}


	//----------------------------- FIND
	findById(_id, options) {
		return this.find({_id}, options);
	}

	findByIds(_ids, options) {
		return this.find({_id: {$in: [].concat(_ids)}}, options);
	}

	findBySupportArea(supportArea, options) {
		const query = {supportArea};
		return this.find(query, options);
	}

	findByRoomId(roomId, options) {
		const query = {roomId};
		return this.find(query, options);
	}

	//---------------------------- CREATE
	createForSupportArea(supportArea, roomId, question='', environment={}) {
		const helpRequest = {
			createdOn: new Date(),
			supportArea,
			roomId,
			question,
			environment,
			resolutionStatus: HelpRequest.RESOLUTION_STATUS.open
		};

		return this.insert(helpRequest);
	}

	//---------------------------- UPDATE
	close(_id, closingProperties={}) {
		const query = {_id};
		const update = {$set: {
			resolutionStatus: HelpRequest.RESOLUTION_STATUS.resolved,
			closingProperties
		}};



		return this.update(query, update);
	}

	registerBotResponse(_id, botMessage) {
		const query = {_id};
		const update = {$set: {latestBotReply: botMessage}};

		return this.update(query, update);
	}

	//----------------------------- REMOVE
	removeById(_id) {
		const query = {_id};
		return this.remove(query);
	}
}

// -------------------------Constants
HelpRequest.RESOLUTION_STATUS = {
	open: 'open',
	authorAction: 'authorAction',
	resolved: 'resolved'
};

RocketChat.models.HelpRequests = new HelpRequest();
