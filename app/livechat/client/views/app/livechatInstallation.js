import { Template } from 'meteor/templating';
import { settings } from '../../../../settings';
import s from 'underscore.string';
import './livechatInstallation.html';

const latestVersion = '1.0.0';

Template.livechatInstallation.helpers({
	oldScript() {
		const siteUrl = s.rtrim(settings.get('Site_Url'), '/');
		return `<!-- Start of Rocket.Chat Livechat Script -->
<script type="text/javascript">
(function(w, d, s, u) {
	w.RocketChat = function(c) { w.RocketChat._.push(c) }; w.RocketChat._ = []; w.RocketChat.url = u;
	var h = d.getElementsByTagName(s)[0], j = d.createElement(s);
	j.async = true; j.src = '${ siteUrl }/packages/rocketchat_livechat/assets/rocketchat-livechat.min.js?_=201702160944';
	h.parentNode.insertBefore(j, h);
})(window, document, 'script', '${ siteUrl }/livechat');
</script>
<!-- End of Rocket.Chat Livechat Script -->`;
	},

	script() {
		const siteUrl = s.rtrim(settings.get('Site_Url'), '/');
		return `<!-- Start of Rocket.Chat Livechat Script -->
<script type="text/javascript">
(function(w, d, s, u) {
	w.RocketChat = function(c) { w.RocketChat._.push(c) }; w.RocketChat._ = []; w.RocketChat.url = u;
	var h = d.getElementsByTagName(s)[0], j = d.createElement(s);
	j.async = true; j.src = '${ siteUrl }/livechat/${ latestVersion }/rocketchat-livechat.min.js?_=201903270000';
	h.parentNode.insertBefore(j, h);
})(window, document, 'script', '${ siteUrl }/livechat?version=${ latestVersion }');
</script>
<!-- End of Rocket.Chat Livechat Script -->`;
	},
});
