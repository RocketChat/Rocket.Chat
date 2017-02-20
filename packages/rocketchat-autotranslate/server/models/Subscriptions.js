RocketChat.models.Subscriptions.updateAutoTranslateById = function(_id, autoTranslate) {
	const query = {
		_id: _id
	};

	let update;
	if (autoTranslate) {
		update = {
			$set: {
				autoTranslate: autoTranslate
			}
		};
	} else {
		update = {
			$unset: {
				autoTranslate: 1
			}
		};
	}

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateAutoTranslateLanguageById = function(_id, autoTranslateLanguage) {
	const query = {
		_id: _id
	};

	const update = {
		$set: {
			autoTranslateLanguage: autoTranslateLanguage
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateAutoTranslateDisplayById = function(_id, autoTranslateDisplay) {
	const query = {
		_id: _id
	};

	let update;
	if (autoTranslateDisplay) {
		update = {
			$set: {
				autoTranslateDisplay: autoTranslateDisplay
			}
		};
	} else {
		update = {
			$unset: {
				autoTranslateDisplay: 1
			}
		};
	}

	return this.update(query, update);
};
RocketChat.models.Subscriptions.getAutoTranslateLanguagesByRoom = function(rid) {
	const subscriptionsRaw = RocketChat.models.Subscriptions.model.rawCollection();
	const distinct = Meteor.wrapAsync(subscriptionsRaw.distinct, subscriptionsRaw);
	const query = {
		rid: rid,
		autoTranslate: true
	};
	return distinct('autoTranslateLanguage', query);
};
