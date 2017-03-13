Template.clientResultQuery.onCreated(function () {

	this.helpRequest = new ReactiveVar({});
	this.url = this.data.query.url;
	this.counter = 0;
	this.resultsExpanded = true;

	Session.set('searchUrl', this.url + "+" + this.counter++);

	const self = this;

	this.autorun(() => {
		var currUrl = Session.get('searchUrl');
		console.log("executeSearch " + currUrl);
		$.ajax({
			url: currUrl,
			dataType: "jsonp",
			jsonp: 'json.wrf',
			success: function (data) {
				console.log(data);
				self.helpRequest.set(data);
			}
		});
	});
});

Template.clientResultQuery.helpers({

	searchResult: function () {
		return Template.instance().helpRequest.get();
	},
	counter: function () {
		return Template.instance().counter;
	},
	classExpanded(){
		const instance = Template.instance();
		return instance.resultsExpanded ? 'expanded' : 'collapsed';
	},
	dbSearchResult(query, index){
		return query.creator == "dbsearch";
	},
	getQueryDisplayTitle(){
		const instance = Template.instance();
		return instance.data.query.displayTitle;
	},
	getCreatorText(){
		const instance = Template.instance();
		return instance.data.query.displayTitle;
	}
});


Template.clientResultQuery.events({

	'click .executeDBSearch': function (event, template) {
		console.log("URL: " + Template.currentData().url);
		console.log("Counter: " + template.counter);
		Session.set('searchUrl', Template.instance().url + "+" + template.counter++);
	},
	'click .client.js-toggle-results-expanded': function (event, instance) {
		const current = instance.resultsExpanded;
		instance.resultsExpanded = !current;
	},
	'click .result-item-wrapper .js-toggle-result-preview-expanded': function (event, instance) {
		const current = instance.resultsExpanded;
		instance.resultsExpanded = !current;
	}
});
