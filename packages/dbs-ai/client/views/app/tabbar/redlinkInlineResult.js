/* globals _dbs */

import toastr from 'toastr';
import { ReactiveDict } from 'meteor/reactive-dict';

Template.redlinkInlineResult._copyReplySuggestion = function(event, instance) {
	if (instance.data.result.replySuggestion) {
		$('#chat-window-' + instance.data.roomId + ' .input-message').val(instance.data.result.replySuggestion);
	}
};

Template.redlinkInlineResult.helpers({
	templateName() {
		const instance = Template.instance();

		let templateSuffix = 'generic';
		switch (instance.data.creator) {
			case 'bahn.de':
				templateSuffix = 'bahn_de';
				break;
			case 'community.bahn.de':
				templateSuffix = 'VKL_community';
				break;
			case 'VKL':
				templateSuffix = 'VKL_community';
				break;
			case 'Hasso-MLT':
				templateSuffix = 'Hasso';
				break;
			case 'Hasso-Search':
				templateSuffix = 'Hasso';
				break;
			default:
				if (Template['redlinkInlineResult_' + instance.data.creator]) {
					templateSuffix = instance.data.creator;
				} else {
					templateSuffix = 'generic';
				}
				break;
		}
		return 'redlinkInlineResult_' + templateSuffix;
	},
	templateData() {
		const instance = Template.instance();
		return {
			result: instance.data.result,
			roomId: instance.data.roomId
		};
	}
});

Template.redlinkInlineResult.events({
	'click .js-copy-reply-suggestion': function(event, instance) {
		return Template.redlinkInlineResult._copyReplySuggestion(event, instance);
	}
});

//----------------------------------- Generic helper as fallback ------------------------------

Template.redlinkInlineResult_generic.helpers({
	relevantKeyValues() {
		const instance = Template.instance();

		const keyValuePairs = [];
		for (const key in instance.data.result) {
			if (Object.prototype.hasOwnProperty.call(instance.data.result, key)) {
				keyValuePairs.push({key: key, value: instance.data.result[key]});
			}
		}

		return keyValuePairs;
	}
});

//------------------------------------- Bahn.de -----------------------------------------------

Template.redlinkInlineResult_bahn_de.events({
	'click .js-copy-reply-suggestion': function(event, instance) {
		return Template.redlinkInlineResult._copyReplySuggestion(event, instance);
	}
});

Template.redlinkInlineResult_bahn_de.helpers({
	durationformat(val) {
		return new _dbs.Duration(val * 60 * 1000).toHHMMSS();
	}
});

//----------------------------------- VKL and community ---------------------------------------
Template.redlinkInlineResult_VKL_community.helpers({
	classExpanded() {
		const instance = Template.instance();
		return instance.state.get('expanded') ? 'expanded' : 'collapsed';
	}
});

Template.redlinkInlineResult_VKL_community.events({
	'click .result-item-wrapper .js-toggle-result-preview-expanded': function(event, instance) {
		const current = instance.state.get('expanded');
		instance.state.set('expanded', !current);
	}
});

Template.redlinkInlineResult_VKL_community.onCreated(function() {
	this.state = new ReactiveDict();
	this.state.setDefault({
		expanded: false
	});
});

//-------------------------------------- Assistify --------------------------------
Template.inlineResultMessage.helpers({
	getOriginatorClass(message) {
		switch (message.origin) {
			case 'User':
				return 'seeker';
			case 'Agent':
				return 'provider';
			default:
				return 'unknown';
		}
	},
	getSelectedClass() {
		const instance = Template.instance();

		if (instance.selected.get()) {
			return 'selected';
		}
	}
});

Template.inlineResultMessage.events({
	'click .conversationMessage': function(event, instance) {
		const current = instance.selected.get();

		instance.selected.set(!current);

		if (instance.selected.get()) {
			Template.redlinkQueries.utilities.addCleanupActivity(() => {
				instance.selected.set(false);
			});

		}
	}
});

Template.inlineResultMessage.onCreated(function() {
	const instance = this;

	instance.selected = new ReactiveVar(false);
});


Template.redlinkInlineResult_Hasso.events({
	'click .result-item-wrapper .js-toggle-result-preview-expanded': function(event, instance) {
		const current = instance.state.get('expanded');
		instance.state.set('expanded', !current);

		if (!instance.state.get('expanded')) {
			Template.redlinkQueries.utilities.resultsInteractionCleanup();
		}
	},
	'click .js-send-message': function(event, instance) {

		/* buffer metadata of messages which are _about to be sent_
		 * This is necessary as the results or queries displayed may be entered into the message-area,
		 * but only one the message is actually sent, the metadata becomes effective for this new message
		 * - and only by then we know the message-id for which this metadata is actually valid
		 */
		Session.set('messageMetadata', {
			user: Meteor.user(),
			room: instance.data.roomId,
			metadata: {
				origin: 'historicConversation',
				conversationId: instance.data.result.conversationId
			}
		});

		//create a text-response
		let textToInsert = '';
		const selectedMessages = instance.findAll('.selected');
		if (selectedMessages.length > 0) {
			textToInsert = selectedMessages.reduce(function(concat, elem) {
				return concat + ' ' + elem.textContent;
			},
				'');
		} else {
			//translate GUID of the conversation provided into a link
			const originRoom = RocketChat.models.Rooms.findOne({_id: instance.data.result.conversationId});
			if (originRoom) {
				const routeLink = RocketChat.roomTypes.getRouteLink(originRoom.t, originRoom);
				const roomLink = Meteor.absoluteUrl() + routeLink.slice(1, routeLink.length);
				textToInsert = TAPi18n.__('Link_provided') + ' ' + roomLink;
			} else {
				return toastr.info(TAPi18n.__('No_room_link_possible'));
			}
		}

		$('#chat-window-' + instance.data.roomId + ' .input-message').val(textToInsert.trim()).focus();
	}
});

Template.redlinkInlineResult_Hasso.helpers({
	classExpanded() {
		const instance = Template.instance();
		return instance.state.get('expanded') ? 'expanded' : 'collapsed';
	},
	getResultTitle() {
		const instance = Template.instance();
		if (instance.state.get('expanded') && instance.state.get('conversationLoaded')) {
			return instance.state.get('conversation').messages[0].content;
		} else {
			return instance.data.result.content;
		}
	},
	originQuestion() {
		const instance = Template.instance();
		if (instance.state.get('conversation') && instance.state.get('conversationLoaded')) {
			return instance.state.get('conversation').messages[0].content;
		}
	},
	latestResponse() {
		const instance = Template.instance();
		if (instance.state.get('conversation') && instance.state.get('conversationLoaded')) {
			return instance.state.get('conversation').messages.filter((message) => message.user && message.user.displayName === 'Provider').pop().text;
		}
	},

	subsequentCommunication() {
		const instance = Template.instance();
		if (instance.state.get('conversation') && instance.state.get('conversationLoaded')) {
			return instance.state.get('conversation').messages.slice(1);
		}
	}
});

Template.redlinkInlineResult_Hasso.onCreated(function() {
	const instance = this;

	this.state = new ReactiveDict();
	this.state.setDefault({
		expanded: false,
		conversation: {},
		conversationLoaded: false
	});


	instance.autorun(() => {

		if (instance.state.get('expanded')) {
			Meteor.call('redlink:getStoredConversation', instance.data.result.conversationId,
				(err, conversation) => {
					if (!err) {
						instance.state.set('conversation', conversation);
						instance.state.set('conversationLoaded', true);
					} else {
						console.error(err);
					}
				}
			);
		}

	});
});

Template.redlinkInlineResult_dbsearch.onCreated(function() {

	this.state = new ReactiveDict();
	this.state.setDefault({
		expanded: false
	});
});

Template.redlinkInlineResult_dbsearch.helpers({
	classExpanded() {
		const instance = Template.instance();
		return instance.state.get('expanded') ? 'expanded' : 'collapsed';
	}
});

Template.redlinkInlineResult_dbsearch.events({

	'click .result-item-wrapper .js-toggle-result-preview-expanded': function(event, instance) {
		const current = instance.state.get('expanded');
		instance.state.set('expanded', !current);

		if (!instance.state.get('expanded')) {
			Template.redlinkQueries.utilities.resultsInteractionCleanup();
		}
	},
	'click .js-send-message': function(event, instance) {

		/* buffer metadata of messages which are _about to be sent_
		 * This is necessary as the results or queries displayed may be entered into the message-area,
		 * but only one the message is actually sent, the metadata becomes effective for this new message
		 * - and only by then we know the message-id for which this metadata is actually valid
		 */
		Session.set('messageMetadata', {
			user: Meteor.user(),
			room: instance.data.roomId,
			metadata: {
				origin: 'historicConversation',
				searchLink: instance.data.result.dbsearch_link_s
			}
		});

		//create a text-response
		let textToInsert = '';
		const selectedMessages = instance.findAll('.selected');
		if (selectedMessages.length > 0) {
			textToInsert = selectedMessages.reduce(function(concat, elem) {
				return concat + ' ' + elem.textContent;
			},
				'');
		} else {
			textToInsert = instance.data.result.dbsearch_link_s;
		}

		$('#chat-window-' + instance.data.roomId + ' .input-message').val(textToInsert).focus();
	}

});
