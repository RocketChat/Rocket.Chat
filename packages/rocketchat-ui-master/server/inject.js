/* globals Inject */

Inject.rawBody('page-loading', `
	<div class="page-loading">
		<div class="spinner">
			<div class="rect1"></div>
			<div class="rect2"></div>
			<div class="rect3"></div>
			<div class="rect4"></div>
			<div class="rect5"></div>
		</div>
	</div>`
);

RocketChat.settings.get('Site_Url', function() {
	Meteor.defer(function() {
		if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
			let base_url = __meteor_runtime_config__.ROOT_URL+__meteor_runtime_config__.ROOT_URL_PATH_PREFIX;

			if(/\/$/.test(base_url) === false) {
				base_url += '/';
			}

			Inject.rawHead('base', `<base href="${base_url}">`);
		} else {
			Inject.rawHead('base', '');
		}
	});
});
