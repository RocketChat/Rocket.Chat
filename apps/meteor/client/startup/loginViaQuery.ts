import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { router } from '../providers/RouterProvider';

Meteor.startup(() => {
	Tracker.afterFlush(() => {
		const { resumeToken } = router.getSearchParameters();
		if (!resumeToken) {
			return;
		}

		Meteor.loginWithToken(resumeToken, () => {
			const routeName = router.getRouteName();

			if (!routeName) {
				router.navigate('/home');
			}

			const { resumeToken: _, userId: __, ...search } = router.getSearchParameters();

			router.navigate(
				{
					pathname: router.getLocationPathname(),
					search,
				},
				{ replace: true },
			);
		});
	});
});
