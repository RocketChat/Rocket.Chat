import moment from 'moment';
const colors = {
	good: '#35AC19',
	warning: '#FCB316',
	danger: '#D30230'
};
const fixCordova = function(url) {
	if (url && url.indexOf('data:image') === 0) {
		return url;
	}
	if (Meteor.isCordova && (url && url[0] === '/')) {
		url = Meteor.absoluteUrl().replace(/\/$/, '') + url;
		const query = `rc_uid=${ Meteor.userId() }&rc_token=${ Meteor._localStorage.getItem('Meteor.loginToken') }`;
		if (url.indexOf('?') === -1) {
			url = `${ url }?${ query }`;
		} else {
			url = `${ url }&${ query }`;
		}
	}
	if (Meteor.settings['public'].sandstorm || url.match(/^(https?:)?\/\//i)) {
		return url;
	} else if (navigator.userAgent.indexOf('Electron') > -1) {
		return __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + url;
	} else {
		return Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + url;
	}
};
/*globals renderMessageBody*/
Template.messageAttachment.helpers({
	fixCordova,
	parsedText() {
		return renderMessageBody({
			msg: this.text
		});
	},
	loadImage() {
		const user = Meteor.user();
		if (user && user.settings && user.settings.preferences && this.downloadImages !== true) {
			if (user.settings.preferences.autoImageLoad === false) {
				return false;
			}
			if (Meteor.Device.isPhone() && user.settings.preferences.saveMobileBandwidth !== true) {
				return false;
			}
		}
		return true;
	},
	getImageHeight(height = 200) {
		return height;
	},
	color() {
		return colors[this.color] || this.color;
	},
	collapsed() {
		if (this.collapsed != null) {
			return this.collapsed;
		} else {
			const user = Meteor.user();
			return user && user.settings && user.settings.preferences && user.settings.preferences.collapseMediaByDefault === true;
		}
	},
	time() {
		const messageDate = new Date(this.ts);
		const today = new Date();
		if (messageDate.toDateString() === today.toDateString()) {
			return moment(this.ts).format(RocketChat.settings.get('Message_TimeFormat'));
		} else {
			return moment(this.ts).format(RocketChat.settings.get('Message_TimeAndDateFormat'));
		}
	},
	injectIndex(data, previousIndex, index) {
		data.index = `${ previousIndex }.attachments.${ index }`;
	},
	decryptFile() {
		console.log(this);
		var xhttp = new XMLHttpRequest();
		var self = this;
		
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				console.log(xhttp.response);

				// Add this stuff in an IF conditional
				//
				//
				// const decryptedMsg = new Promise((resolve) => {
				// 		Meteor.call('fetchGroupE2EKey', e2eRoom.roomId, function(error, result) {
				// 			let cipherText = EJSON.parse(result);
				// 			const vector = cipherText.slice(0, 16);
				// 			cipherText = cipherText.slice(16);
				// 			decrypt_promise = crypto.subtle.decrypt({name: 'RSA-OAEP', iv: vector}, RocketChat.E2EStorage.get('RSA-PrivKey'), cipherText);
				// 			decrypt_promise.then(function(result) {
				// 				e2eRoom.exportedSessionKey = ab2str(result);
				// 				crypto.subtle.importKey('jwk', EJSON.parse(e2eRoom.exportedSessionKey), {name: 'AES-CBC', iv: vector}, true, ['encrypt', 'decrypt']).then(function(key) {
				// 					e2eRoom.groupSessionKey = key;
				// 					e2eRoom.established.set(true);
				// 					e2eRoom.establishing.set(false);
				// 					e2eRoom.decrypt(message.msg).then((data) => {
				// 						// const {id, text, ack} = data;
				// 						message._id = data._id;
				// 						message.msg = data.text;
				// 						message.ack = data.ack;
				// 						if (data.ts) {
				// 							message.ts = data.ts;
				// 						}
				// 						resolve(message);
				// 					});

				// 				});
				// 			});
				// 			decrypt_promise.catch(function(err) {
				// 				console.log(err);
				// 			});



		        RocketChat.E2E.getInstanceByRoomId(self.rid).decryptFile(xhttp.response)
					.then((msg) => {
						console.log(msg);
						if (msg) {
							var decryptedFile = new File([msg], self.title);
							var downloadUrl = URL.createObjectURL(decryptedFile);
							console.log(downloadUrl);
						    var a = document.createElement("a");
						    document.body.appendChild(a);
						    a.style = "display: none";
						    a.href = downloadUrl;
						    a.download = self.title;
						    a.click();
						}
					});
			}
		};
		xhttp.open("GET", this.title_link, true);
		// xhttp.responseType = "blob";
		xhttp.send();
	}
});
