import { Template } from 'meteor/templating';
import { settings } from '/app/settings';
import s from 'underscore.string';

const siteUrl = s.rtrim(settings.get('Site_Url'), '/');

Template.livechatInstallation.helpers({
	oldScript() {
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
		return `<!-- Start of Rocket.Chat Livechat Script -->
<script type="text/javascript">
(function(w, d, s, u) {
	w.RocketChat = function(c) { w.RocketChat._.push(c) }; w.RocketChat._ = []; w.RocketChat.url = u;
	var h = d.getElementsByTagName(s)[0], j = d.createElement(s);
	j.async = true; j.src = '${ siteUrl }/livechat/1.0/rocketchat-livechat.min.js?_=201903270000';
	h.parentNode.insertBefore(j, h);
})(window, document, 'script', '${ siteUrl }/livechat?version=1.0');
</script>
<!-- End of Rocket.Chat Livechat Script -->`;
	},
});
