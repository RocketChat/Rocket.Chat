RocketChat.Migrations.add({
	version: 37,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			var footer = RocketChat.models.Settings.findOne('Layout_Sidenav_Footer');

			// Replace footer octicons with icons
			if (footer && footer.value !== '') {
				var footerValue = footer.value.replace('octicon octicon-pencil', 'icon-pencil');
				footerValue = footer.replace('octicon octicon-heart', 'icon-heart');
				footerValue = footer.replace('octicon octicon-mark-github', 'icon-github-circled');
				RocketChat.models.Settings.update({ _id: 'Layout_Sidenav_Footer' }, { $set: { value: footerValue, packageValue: footerValue } });
			}
		}
	}
});
