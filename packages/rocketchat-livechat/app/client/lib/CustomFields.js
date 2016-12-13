this.CustomFields = (function() {
	var queue = {};
	var initiated = false;

	var setCustomField = function(token, key, value) {
		if (!initiated) {
			// queue by key
			queue[key] = { token, value };
			return;
		}
		Meteor.call('livechat:setCustomField', token, key, value);
	};

	var init = function() {
		Tracker.autorun(function() {
			if (Meteor.userId()) {
				initiated = true;
				Object.keys(queue).forEach((key) => {
					setCustomField.call(this, queue[key].token, key, queue[key].value);
				});
				queue = {};
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
