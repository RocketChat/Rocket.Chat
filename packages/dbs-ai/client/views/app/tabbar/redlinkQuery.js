Template.redlinkQuery.helpers({
	hasResult(){
		const results = Template.instance().state.get('results');
		if (results) {
			return results.length > 0;
		} else {
			return false;
		}
	},

	isDirty(){
		return Template.instance().state.get('status') === 'dirty'
	},

	classExpanded(){
		const instance = Template.instance();
		return instance.state.get('resultsExpanded') ? 'expanded' : 'collapsed';
	},

	queryPreviewHeadline(){
		const instance = Template.instance();
		const results = instance.state.get('results');
		if (results) {
			const creator = results[0].creator; //all results have got the same creator
			switch (creator) {
				case 'community.bahn.de':
					return t('results_community_bahn_de');
				case 'bahn.de':
					return t('results_bahn_de');
				default:
					return t('results');
			}
		}
	},

	navigationOptions(){
		const instance = Template.instance();
		const results = instance.state.get('results');
		if (results) {
			const creator = results[0].creator; //all results have got the same creator
			let options = {
				results: results,
				roomId: instance.data.roomId
			};

			switch (creator) {
				case 'bahn.de':
					options.template = 'redlinkResultContainer_Slider';
					options.stepping = 2;
					break;
				case 'VKL':
					options.template = 'redlinkResultContainer_Slider';
					options.stepping = 3;
					break;
				default:
					options.template = 'redlinkResultContainer_Slider';
					options.stepping = 5;
			}
			return options;
		}
	},
	getCreatorText(){
		const instance = Template.instance();
		if(instance.data.query.creator === 'Hasso-MLT' || instance.data.query.creator === 'Hasso-Search'){
			return "";
		} else {
			return TAPi18n.__(instance.data.query.replacedCreator);
		}
	},
	getQueryDisplayTitle(){
		const instance = Template.instance();
		if(instance.data.query.creator === 'Hasso-MLT'){
			return 'Ähnliche Fragen';
		}
		if(instance.data.query.creator === 'Hasso-Search'){
			return instance.data.query.displayTitle
				.replace("Conversationen zum", "Zum")
				.replace(/[|]/g, "");
		}

		// else
		return instance.data.query.displayTitle;
	}
});

Template.redlinkQuery.events({
	'click .js-toggle-results-expanded': function (event, instance) {
		const current = instance.state.get('resultsExpanded');
		instance.state.set('resultsExpanded', !current);
	}
});

Template.redlinkQuery.onCreated(function () {
	const instance = this;

	this.state = new ReactiveDict();
	this.state.setDefault({
		resultsExpanded: instance.data.query.inlineResultSupport && ( instance.data.maxConfidence === instance.data.query.confidence ),
		results: [],
		status: 'initial'
	});

	// Asynchronously load the results.
	instance.autorun(()=> {
		if (instance.data && instance.data.query && instance.data.roomId) {
			//subscribe to the external messages for the room in order to re-fetch the results once the result
			// of the knowledge provider changes
			this.subscribe('livechat:externalMessages', Template.currentData().roomId);

			//issue a request to the redlink results-service and buffer the potential results in a reactive variable
			//which then can be forwarded to the results-template
			if (instance.data.query.inlineResultSupport) {
				instance.state.set('status', 'dirty');
				Meteor.call('redlink:retrieveResults', instance.data.roomId, instance.data.templateIndex, instance.data.query.creator, (err, results)=> {
					instance.state.set('results', results);
					instance.state.set('status', 'fetched');
				});
			}
		}
	})

});
