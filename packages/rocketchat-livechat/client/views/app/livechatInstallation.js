import toastr from 'toastr';

Template.livechatInstallation.helpers({
	script() {
		let siteUrl = s.rtrim(RocketChat.settings.get('Site_Url'), '/');

		return `<!-- Start of Rocket.Chat Livechat Script -->
<script type="text/javascript">
(function(w, d, s, u) {
	w.RocketChat = function(c) { w.RocketChat._.push(c) }; w.RocketChat._ = []; w.RocketChat.url = u;
	var h = d.getElementsByTagName(s)[0], j = d.createElement(s);
	j.async = true; j.src = '${siteUrl}/packages/rocketchat_livechat/assets/rocket-livechat.js';
	h.parentNode.insertBefore(j, h);
})(window, document, 'script', '${siteUrl}/livechat');
</script>
<!-- End of Rocket.Chat Livechat Script -->`;
	},

	domains() {
		return LivechatValidDomains.find();
	},
	enableWidgetDomainsTrueChecked() {
		if (Template.instance().enableWidgetDomains.get()) {
			return 'checked';
		}
	},
	enableWidgetDomainsFalseChecked() {
		if (!Template.instance().enableWidgetDomains.get()) {
			return 'checked';
		}
	},
});

Template.livechatInstallation.events({
	'change .preview-settings, keyup .preview-settings'(e, instance) {
		let value = e.currentTarget.value;
		if (e.currentTarget.type === 'radio') {
			value = value === 'true';
		}
		instance[e.currentTarget.name].set(value);
	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();

		var settings = [{
				_id: 'enable_widget_domains',
				value: instance.enableWidgetDomains.get()
		}];
		RocketChat.settings.batchSet(settings, (err/*, success*/) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(t('Settings_updated'));
		});
	},
	'click .add-domain'(e, instance) {
		swal({
			title: t('enter-domain'),
			type: 'input',
			showCancelButton: true,
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, (response) => {
			if ((typeof response === 'boolean') && !response) {
				return true;
			}
			if ((!response) || response.trim() === '') {
				swal.showInputError(t('please_enter_valid_domain'));
				return false;
			}
			Meteor.call('livechat:addValidDomain', response, function(error/*, result*/) {
				if (error) {
					return handleError(error);
				}
				swal({
					title: t('Success'),
					text: t('Domain_added'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});	
		});
	},
	'click .remove-domain'(e/*, instance*/) {
		e.preventDefault();
		e.stopPropagation();
		
		console.log("id: ", this._id);
		
		swal({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, () => {
			Meteor.call('livechat:removeValidDomain', this._id, function(error/*, result*/) {
				if (error) {
					return handleError(error);
				}
				swal({
					title: t('Removed'),
					text: t('Domain_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});
		});
	}
});

Template.livechatInstallation.onCreated(function() {
	this.subscribe('livechat:validDomain');

	this.enableWidgetDomains = new ReactiveVar(null);

	this.autorun(() => {
		this.enableWidgetDomains.set(RocketChat.settings.get('enable_widget_domains'));
	});
});