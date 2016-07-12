Template.visitorEdit.helpers({
	visitor() {
		return Template.instance().visitor.get();
	},

	room() {
		return Template.instance().room.get();
	},

	email() {
		const visitor = Template.instance().visitor.get();
		if (visitor.emails && visitor.emails.length > 0) {
			return visitor.emails[0].address;
		}
	},

	phone() {
		const visitor = Template.instance().visitor.get();
		if (visitor.phone && visitor.phone.length > 0) {
			return visitor.phone[0].phoneNumber;
		}
	},

	joinTags() {
		return this.tags && this.tags.join(', ');
	}
});

Template.visitorEdit.onCreated(function() {
	this.visitor = new ReactiveVar();
	this.room = new ReactiveVar();

	this.autorun(() => {
		this.visitor.set(Meteor.users.findOne({ _id: Template.currentData().visitorId }));
	});

	this.autorun(() => {
		this.room.set(ChatRoom.findOne({ _id: Template.currentData().roomId }));
	});
});

Template.visitorEdit.events({
	'submit form'(event, instance) {
		console.log('this ->', this);
		event.preventDefault();
		let userData = { _id: instance.visitor.get()._id };
		let roomData = { _id: instance.room.get()._id };

		userData.name = event.currentTarget.elements['name'].value;
		userData.email = event.currentTarget.elements['email'].value;
		userData.phone = event.currentTarget.elements['phone'].value;

		roomData.topic = event.currentTarget.elements['topic'].value;
		roomData.tags = event.currentTarget.elements['tags'].value;

		Meteor.call('livechat:saveLivechatInfo', userData, roomData, (err) => {
			if (err) {
				toastr.error(t(err.error));
			} else {
				toastr.success(t('Saved'));
			}
		});
	},

	'click .save'() {
		this.save();
	},

	'click .cancel'() {
		this.cancel();
	}
});
