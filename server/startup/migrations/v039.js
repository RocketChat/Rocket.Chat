import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 39,
	up() {
		if (Settings) {
			const footer = Settings.findOne({ _id: 'Layout_Sidenav_Footer' });

			// Replace footer octicons with icons
			if (footer && footer.value !== '') {
				let footerValue = footer.value.replace('octicon octicon-pencil', 'icon-pencil');
				footerValue = footerValue.replace('octicon octicon-heart', 'icon-heart');
				footerValue = footerValue.replace('octicon octicon-mark-github', 'icon-github-circled');
				Settings.update({ _id: 'Layout_Sidenav_Footer' }, { $set: { value: footerValue, packageValue: footerValue } });
			}
		}
	},
});
