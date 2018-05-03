RocketChat.Migrations.add({
	version: 39,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			const footer = RocketChat.models.Settings.findOne({ _id: 'Layout_Sidenav_Footer' });

			// Replace footer octicons with icons
			if (footer && footer.value !== '') {
				let footerValue = footer.value.replace('octicon octicon-pencil', 'icon-pencil');
				footerValue = footerValue.replace('octicon octicon-heart', 'icon-heart');
				footerValue = footerValue.replace('octicon octicon-mark-github', 'icon-github-circled');
				RocketChat.models.Settings.update({ _id: 'Layout_Sidenav_Footer' }, { $set: { value: footerValue, packageValue: footerValue } });
			}
		}
	}
});
