Template.HelpRequestActions.helpers({
	helprequestOpen() {
		const instance = Template.instance();
		const helpRequest = instance.helpRequest.get();
		if (helpRequest) {
			return helpRequest.resolutionStatus && helpRequest.resolutionStatus !== 'resolved'; //undefined in livechats
		}
	},

	isLivechat() {
		const instance = Template.instance();
		const room = ChatSubscription.findOne({rid: instance.data.roomId});
		return room.t === 'l';
	},

	livechatOpen() {
		const instance = Template.instance();
		const room = ChatSubscription.findOne({rid: instance.data.roomId});
		return room.open;
	}
});

Template.HelpRequestActions.dialogs = {
	ClosingDialog: class {
		/**
		 * @param room the room to get the values from
		 * @param properties (optional) SweetAlert options
		 */
		constructor(helpRequest, properties) {
			this.room = ChatRoom.findOne(helpRequest.roomId);
			this.properties = _.isObject(properties) ? properties : {};
		}

		/**
		 * @return Promise (keep in mind that native es6-promises aren't cancelable. So always provide a then & catch)
		 */
		display() {
			const self = this;
			return new Promise(function(resolve, reject) {
				swal.withForm(_.extend({
					title: t('Closing_chat'),
					text: '',
					formFields: [{
						id: 'comment',
						value: self.room.comment,
						type: 'input',
						label: t('comment'),
						placeholder: t('Please_add_a_comment')
					}, {
						id: 'tags',
						value: self.room.tags ? self.room.tags.join(', ') : '',
						type: 'input',
						placeholder: t('Please_add_a_tag')
					}, {
						id: 'knowledgeProviderUsage',
						type: 'select',
						options: [
							{value: 'Unknown', text: t('knowledge_provider_usage_unknown')},
							{value: 'Perfect', text: t('knowledge_provider_usage_perfect')},
							{value: 'Helpful', text: t('knowledge_provider_usage_helpful')},
							{value: 'NotUsed', text: t('knowledge_provider_usage_not_used')},
							{value: 'Useless', text: t('knowledge_provider_usage_useless')}
						]
					}],
					showCancelButton: true,
					closeOnConfirm: false
				}, self.properties), function(isConfirm) {
					if (!isConfirm) { //on cancel
						$('.swal-form').remove(); //possible bug? why I have to do this manually
						reject();
						return false;
					}
					const form = this.swalForm;
					resolve(form);
				});
			}).then((r) => {
				$('.sa-input-error').show();
				return r;
			}).catch((reason) => {
				throw reason;
			});
		}
	}
};

Template.HelpRequestActions.events({
	'click .close-helprequest'(event, instance) {
		event.preventDefault();

		swal(_.extend({
			title: t('Closing_chat'),
			type: 'input',
			inputPlaceholder: t('Please_add_a_comment'),
			showCancelButton: true,
			closeOnConfirm: false,
			roomId: instance.data.roomId
		}), (inputValue) => {
			//inputValue is false on "cancel" and has a string value of the input if confirmed.
			if (!(typeof inputValue === 'boolean' && inputValue === false)) {
				Meteor.call('assistify:closeHelpRequest', this.roomId, {comment: inputValue}, function(error) {
					if (error) {
						return handleError(error);
					} else {
						swal({
							title: t('Chat_closed'),
							text: t('Chat_closed_successfully'),
							type: 'success',
							timer: 1000,
							showConfirmButton: false
						});

						instance.helpRequest.set(
							RocketChat.models.HelpRequests.findOneByRoomId(instance.data.roomId)
						);
					}
				});
			}
		});
	},
	'click .close-livechat'(event) {
		event.preventDefault();

		swal({
			title: t('Closing_chat'),
			type: 'input',
			inputPlaceholder: t('Please_add_a_comment'),
			showCancelButton: true,
			closeOnConfirm: false
		}, (inputValue) => {
			//inputValue is false on "cancel" and has a string value of the input if confirmed.
			if (!(typeof inputValue === 'boolean' && inputValue === false)) {

				Meteor.call('livechat:closeRoom', this.roomId, inputValue, function(error/*, result*/) {
					if (error) {
						return handleError(error);
					}
					swal({
						title: t('Chat_closed'),
						text: t('Chat_closed_successfully'),
						type: 'success',
						timer: 1000,
						showConfirmButton: false
					});
				});
			}
		});
	}
});

Template.HelpRequestActions.onCreated(function() {
	const instance = this;
	this.helpRequest = new ReactiveVar(null);
	this.room = new ReactiveVar(null);
	this.autorun(() => {
		if (instance.data && instance.data.roomId) {
			Meteor.subscribe('assistify:helpRequests', instance.data.roomId); //not reactively needed, as roomId doesn't change

			const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(instance.data.roomId);
			instance.helpRequest.set(helpRequest);

			const room = ChatSubscription.findOne({rid: instance.data.roomId});
			instance.room.set(room);
		}
	});
});
