this.CustomFields = (function() {
	var queue = [];
	var initiated = false;

	var setCustomField = function(token, key, value) {
		if (!initiated) {
			return queue.push([token, key, value]);
		}
		Meteor.call('livechat:setCustomField', token, key, value);
	};

	var init = function() {
		Tracker.autorun(function() {
			if (Meteor.userId()) {
				initiated = true;
				queue.forEach(function(params) {
					setCustomField.apply(this, params);
				});
				queue = [];
			} else {
				initiated = false;
			}
		});
	};

	return {
		init: init,
		setCustomField: setCustomField
	};
}());
