Template.oembedSandstormGrain.helpers({
	token() {
		return this.meta.sandstorm.grain.token;
	},
	appTitle() {
		return this.meta.sandstorm.grain.appTitle.defaultText;
	},
	grainTitle() {
		return this.meta.sandstorm.grain.grainTitle;
	},
	appIconUrl() {
		return this.meta.sandstorm.grain.appIconUrl;
	},
	descriptor() {
		return this.meta.sandstorm.grain.descriptor;
	}
});

window.sandstormOembed = function(e) {
	e = e || window.event;
	const src = e.target || e.srcElement;
	const token = src.getAttribute('data-token');
	const descriptor = src.getAttribute('data-descriptor');
	return Meteor.call('sandstormOffer', token, descriptor);
};
