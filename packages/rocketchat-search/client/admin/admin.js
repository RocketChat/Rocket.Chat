import toastr from 'toastr';

Template.SearchAdmin.onCreated(function() {

	this.enabled = new ReactiveVar(false);
	this.providers = new ReactiveVar([]);
	this.active = new ReactiveVar();
	this.loading = new ReactiveVar(true);

	this.setActiveProvider = (id) => {
		this.providers.get().forEach((provider) => {
			if (provider.id === id) {
				this.childBinding = {
					configuration: provider.configuration,
					getConfiguration: (e) => { return undefined; }
				};
				this.active.set(provider);
			}
		});
	};

	Meteor.call('rocketchatSearchGetConfiguration', (err, config) => {
		if (err) {
			console.error(err);
			return toastr.error(TAPi18n.__('SEARCH_MSG_ERROR_CANNOT_LOAD_CONFIGURATION'));
		}

		console.debug(config);

		this.providers.set(config.providers);
		this.enabled.set(config.enabled);

		this.setActiveProvider(config.active);

		this.loading.set(false);
	});

	this.store = (id, config, enabled) => {
		Meteor.call('rocketchatSetActiveProvider', id, config, enabled, (err) => {
			if (err) {
				toastr.error(TAPi18n.__('SEARCH_MSG_ERROR_CANNOT_STORE_CONFIGURATION'));
			} else {
				toastr.info(TAPi18n.__('SEARCH_MSG_INFO_CONFIGURATION_STORED_SUCCESSFULLY'));
			}
		});
	};
});

Template.SearchAdmin.events({
	'submit form'(e, t) {
		e.preventDefault();
		const enabled = e.target.enabled.value === 'true';
		const providerId = e.target.provider.value;
		const config = t.childBinding.getConfiguration(e) || t.active.get().configuration;
		t.store(providerId, config, enabled);
	},
	'change .search-provider-selector'(e, t) {
		t.setActiveProvider(e.target.value);
	}
});

Template.SearchAdmin.helpers({
	active() {
		return Template.instance().active.get();
	},
	providers() {
		return Template.instance().providers.get();
	},
	enabled() {
		return Template.instance().enabled.get();
	},
	loading() {
		return Template.instance().loading.get();
	},
	childBinding() {
		return Template.instance().childBinding;
	}
});
