import toastr from 'toastr';

Template.forwardMessage.helpers({
	selected() {
		return Template.instance().forwardRoomsList.get();
	},
	forwardDisabled() {
		return Template.instance().forwardRoomsList.get().length === 0 ? 'disabled' : '';
	},

	autocompleteChannelSettings() {
		return {
			limit: 10,
			inputDelay: 300,
			rules: [
				{
					collection: 'CachedChannelList',
					subscription: 'channelAndPrivateAutocomplete',
					field: 'name',
					matchAll: true,
					filter: {
						exceptions: Template.instance().forwardRoomsList.get().map(u => u.name)
					},
					template: Template.roomSearch,
					noMatchTemplate: Template.roomSearchEmpty,
					doNotChangeWidth: false,
					selector(match) {
						return { name: match };
					},
					sort: 'name'
				}
			]
		};
	}
});

Template.forwardMessage.onCreated(function() {
	this.data.message = ChatMessage.findOne(FlowRouter.getQueryParam('id'));
	this.forwardRoomsList = new ReactiveVar([]);
	this.userFilter = new ReactiveVar('');
});

Template.forwardMessage.onRendered(function() {
	this.firstNode.querySelector('[name="recipients"]').focus();
});

Template.forwardMessage.events({
	'keydown [name="recipients"]'(e, t) {
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const rooms = t.forwardRoomsList;
			const roomsArr = rooms.get();
			roomsArr.pop();
			return rooms.set(roomsArr);
		}
	},
	'click .rc-tags__tag'({target}, t) {
		const {name} = Blaze.getData(target);
		t.forwardRoomsList.set(t.forwardRoomsList.get().filter(room => room.name !== name));
	},
	'autocompleteselect input[name=recipients]'(event, template, item) {
		const rooms = template.forwardRoomsList;
		const roomsArr = rooms.get();
		roomsArr.push(item);
		rooms.set(roomsArr);
		event.currentTarget.value = '';
	},

	'submit .forward-message__content'(event, instance) {
		event.preventDefault();
		event.stopPropagation();
		const rooms = instance.forwardRoomsList.get();

		if (rooms.length > 0) {
			rooms.forEach(room => {
				Meteor.call('sendMessage', {
					_id: Random.id(),
					rid: room._id,
					msg: instance.data.message.msg
				});
			});

			toastr.success(TAPi18n.__('Message_Has_Been_Forward'));

			history.back();
		} else {
			toastr.error(TAPi18n.__('Forward_Has_Empty_Destination'));
		}
	}
});
