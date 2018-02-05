import {RocketChat, UiTextContext} from 'meteor/rocketchat:lib';

const showClosingComment = function() {
	return !RocketChat.settings.get('Assistify_Deactivate_request_closing_comments');
};

Template.HelpRequestActions.helpers({
	helprequestOpen() {
		const instance = Template.instance();
		const helpRequest = instance.helpRequest.get();
		if (helpRequest) {
			return helpRequest.resolutionStatus && helpRequest.resolutionStatus !== 'resolved'; //undefined in livechats
		}
	},

	helprequestClosed() {
		const instance = Template.instance();
		const helpRequest = instance.helpRequest.get();
		if (helpRequest) {
			return helpRequest.resolutionStatus && helpRequest.resolutionStatus === 'resolved'; //undefined in livechats
		}
	},

	isLivechat() {
		const instance = Template.instance();
		const room = ChatSubscription.findOne({rid: instance.data.roomId});
		return room && room.t === 'l';
	},

	livechatOpen() {
		const instance = Template.instance();
		const room = ChatSubscription.findOne({rid: instance.data.roomId});
		return room && room.open;
	},

	isOpenLivechat() {
		const instance = Template.instance();
		const room = ChatSubscription.findOne({rid: instance.data.roomId});
		return room && room.t === 'l' && room.open;
	}
});


Template.HelpRequestActions.events({
	'click .close-helprequest'(event, instance) {
		event.preventDefault();
		const warnText = RocketChat.roomTypes.roomTypes['r'].getUiText(UiTextContext.CLOSE_WARNING);

		let swalConfig = {
			title: t('Closing_chat'),
			text: warnText ? t(warnText) : '',
			showCancelButton: true,
			closeOnConfirm: false,
			roomId: instance.data.roomId
		};

		if (showClosingComment()) {
			swalConfig = _.extend(swalConfig, {
				type: 'input',
				inputPlaceholder: t('Close_request_comment')
			});
		}
		modal.open({
			type: 'input',
			title: t('Closing_chat'),
			text: warnText ? t(warnText) : '',
			showCancelButton: true,
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: true,
			roomId: instance.data.roomId
		}, (inputValue) => {
			Meteor.call('assistify:closeHelpRequest', this.roomId, {comment: inputValue}, function(error) {
				if (error) {
					return handleError(error);
				} else {
					modal.open({
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
		});
	},
	'click .close-livechat'(event) {
		event.preventDefault();
		let swalConfig = {
			title: t('Closing_chat'),
			type: showClosingComment(),
			showCancelButton: true,
			closeOnConfirm: false
		};

		if (showClosingComment()) {
			swalConfig = _.extend(swalConfig, {
				type: 'input',
				inputPlaceholder: t('Please_add_a_comment')
			});
		}

		swal(swalConfig, (inputValue) => {
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
