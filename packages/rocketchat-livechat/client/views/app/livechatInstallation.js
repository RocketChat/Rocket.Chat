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
	}
});

Template.livechatDepartments.events({
	'click .remove-domain'(e/*, instance*/) {
		e.preventDefault();
		e.stopPropagation();

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
			Meteor.call('livechat:removeDomain', this._id, function(error/*, result*/) {
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
	},
});

Template.livechatInstallation.onCreated(function() {
	this.subscribe('livechat:validDomain');
});