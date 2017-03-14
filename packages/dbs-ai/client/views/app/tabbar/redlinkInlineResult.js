Template.redlinkInlineResult._copyReplySuggestion = function (event, instance) {
	if (instance.data.result.replySuggestion) {
		$('#chat-window-' + instance.data.roomId + ' .input-message').val(instance.data.result.replySuggestion);
	}
};

Template.redlinkInlineResult.helpers({
	templateName(){
		const instance = Template.instance();

		let templateSuffix = "generic";
		const creator = instance.data.creator;
		switch (instance.data.creator) {
			case 'bahn.de':
				templateSuffix = "bahn_de";
				break;
			case 'community.bahn.de':
				templateSuffix = "VKL_community";
				break;
			case 'VKL':
				templateSuffix = "VKL_community";
				break;
			case 'Hasso-MLT':
				templateSuffix = "Hasso";
				break;
			case 'Hasso-Search':
				templateSuffix = "Hasso";
				break;
			default:
				if (!!Template['redlinkInlineResult_' + creator]) {
					templateSuffix = creator;
				} else {
					templateSuffix = "generic";
				}
				break;
		}
		return 'redlinkInlineResult_' + templateSuffix;
	},
	templateData(){
		const instance = Template.instance();
		return {
			result: instance.data.result,
			roomId: instance.data.roomId,
			creator: instance.data.creator
		}
	}
});

Template.redlinkInlineResult.events({
	'click .js-copy-reply-suggestion': function (event, instance) {
		return Template.redlinkInlineResult._copyReplySuggestion(event, instance)
	}
});

//----------------------------------- Generic helper as fallback ------------------------------

Template.redlinkInlineResult_generic.helpers({
	relevantKeyValues(){
		const instance = Template.instance();

		let keyValuePairs = [];
		for (key in instance.data.result) {
			keyValuePairs.push({key: key, value: instance.data.result[key]});
		}

		return keyValuePairs;
	}
});

//------------------------------------- Bahn.de -----------------------------------------------

Template.redlinkInlineResult_bahn_de.events({
	'click .js-copy-reply-suggestion': function (event, instance) {
		return Template.redlinkInlineResult._copyReplySuggestion(event, instance)
	}
});

Template.redlinkInlineResult_bahn_de.helpers({
	durationformat(val){
		return new _dbs.Duration(val * 60 * 1000).toHHMMSS();
	}
});

//----------------------------------- VKL and community ---------------------------------------
Template.redlinkInlineResult_VKL_community.helpers({
	classExpanded(){
		const instance = Template.instance();
		return instance.state.get('expanded') ? 'expanded' : 'collapsed';
	}
});

Template.redlinkInlineResult_VKL_community.events({
	'click .result-item-wrapper .js-toggle-result-preview-expanded': function (event, instance) {
		const current = instance.state.get('expanded');
		instance.state.set('expanded', !current);
	},
});

Template.redlinkInlineResult_VKL_community.onCreated(function () {
	const instance = this;

	this.state = new ReactiveDict();
	this.state.setDefault({
		expanded: false
	});
});

//-------------------------------------- Assistify --------------------------------
Template.inlineResultMessage.helpers({
	getOriginatorClass(message){
		if(message.user){
			switch(message.user.displayName.toLowerCase()){
				case 'seeker':
					return 'seeker';
				case 'provider':
					return 'provider';
				default:
					return 'unknown';
			}
		}

	}
});

Template.redlinkInlineResult_Hasso.events({
	'click .result-item-wrapper .js-toggle-result-preview-expanded': function (event, instance) {
		const current = instance.state.get('expanded');
		instance.state.set('expanded', !current);
	}
});

Template.redlinkInlineResult_Hasso.helpers({
	classExpanded(){
		const instance = Template.instance();
		return instance.state.get('expanded') ? 'expanded' : 'collapsed';
	},
	getResultTitle(){
		const instance = Template.instance();
		if(instance.state.get('expanded') && instance.state.get('conversationLoaded')){
			return instance.state.get('conversation').messages[0].content;
		} else {
			return instance.data.result.content
		}
	},
	originQuestion(){
		const instance = Template.instance();
		if(instance.state.get('conversation') && instance.state.get('conversationLoaded')){
			return instance.state.get('conversation').messages[0].content;
		}
	},
	latestResponse(){
		const instance = Template.instance();
		if(instance.state.get('conversation') && instance.state.get('conversationLoaded')){
			return instance.state.get('conversation').messages.filter((message) => message.user && message.user.displayName === 'Provider').pop().text;
		}
	},

	subsequentCommunication(){
		const instance = Template.instance();
		if(instance.state.get('conversation') && instance.state.get('conversationLoaded')) {
			return instance.state.get('conversation').messages.slice(1);
		}
	}
});

Template.redlinkInlineResult_Hasso.onCreated(function (){
	let instance = this;

	this.state = new ReactiveDict();
	this.state.setDefault({
		expanded: false,
		conversation: {},
		conversationLoaded: false
	});


	instance.autorun(()=> {

		if(instance.state.get('expanded')){
			Meteor.call('redlink:getStoredConversation', instance.data.result.conversationId,
				(err, conversation)=>{
				if(!err){
					instance.state.set('conversation', conversation);
					instance.state.set('conversationLoaded', true);
				} else {
					console.error(err);
				}}
			);
		}

	});

});

Template.redlinkInlineResult_dbsearch.onCreated(function (){

	this.state = new ReactiveDict();
	this.state.setDefault({
		expanded: false,
	});
});

Template.redlinkInlineResult_dbsearch.helpers({
	classExpanded(){
		const instance = Template.instance();
		return instance.state.get('expanded') ? 'expanded' : 'collapsed';
	}
});

Template.redlinkInlineResult_dbsearch.events({

	'click .result-item-wrapper .js-toggle-result-preview-expanded': function (event, instance) {
		const current = instance.state.get('expanded');
		instance.state.set('expanded', !current);
	}
});
