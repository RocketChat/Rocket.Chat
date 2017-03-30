const SharedSecret = [];

function EncryptMessage(message) {
	const currentUser = Meteor.user()._id;
	if (message) {
		const currentRoomId = message.rid;
		if (SharedSecret && SharedSecret[currentUser] && SharedSecret[currentUser][currentRoomId]) {
			const currentSecret = SharedSecret[currentUser][currentRoomId];
			const encrypted = CryptoJS.AES.encrypt(message.msg, currentSecret);
			message.msg = encrypted.toString();
			if (message.urls) {
				const messageUrls = message.urls;
				messageUrls.forEach((i) => {
					const urls = messageUrls[i];
					urls.url = CryptoJS.AES.encrypt(urls.url, currentSecret).toString();
				});
			}
			message.encrypted = true;
		}
	}
	return message;
}

function HandleSlashCommand(command, params, item) {
	if (command === 'setsecretkey') {
		const currentUser = Meteor.user()._id;
		const currentRoomId = item.rid;
		let secret = params;
		if (secret === 'off') {
			secret = null;
		}
		if (SharedSecret && SharedSecret[currentUser]) {
			SharedSecret[currentUser][currentRoomId] = secret;
		} else {
			SharedSecret[currentUser] = [];
			SharedSecret[currentUser][currentRoomId] = secret;
		}
	}
}

function DecryptMessage(message) {
	if (message && message.encrypted) {
		const currentRoomId = message.rid;
		const currentSecret = localStorage.getItem(`rocket.chat.sharedSecretKey.${ currentRoomId }`);
		if (currentSecret) {
			const decrypted = CryptoJS.AES.decrypt(message.msg, currentSecret).toString(CryptoJS.enc.Utf8);
			if (decrypted === '') {
				message.msg = '~ encrypted message ~';
				message.html = '~ encrypted message ~';
			} else {
				const lockImage = 'images/lock8.png';
				message.msg = `<img src=${ lockImage } style='width:8px;height:9px;'></img> ${ decrypted }`;
				message.html = `<img src=${ lockImage } style='width:8px;height:9px;'></img> ${ decrypted }`;
			}
			if (message.urls) {
				const messageUrls = message.urls;
				messageUrls.forEach((urls) => {
					urls.url = CryptoJS.AES.decrypt(urls.url, currentSecret).toString(CryptoJS.enc.Utf8);
				});
			}
		} else {
			message.msg = '~ encrypted message ~';
			message.html = '~ encrypted message ~';
		}
	}
	return message;
}

function HandleSlashCommandClient(command, params, item) {
	if (command === 'setsecretkey') {
		let secret = params;
		if (secret === 'off') {
			secret = null;
		}
		const currentRoomId = item.rid;
		localStorage.setItem(`rocket.chat.sharedSecretKey.${ currentRoomId }`, secret);
	}
}
if (Meteor.isServer) {
	RocketChat.callbacks.add('beforeSaveMessage', EncryptMessage, 9999, 'sharedsecret-encrypt-message');
	RocketChat.slashCommands.add('setsecretkey', HandleSlashCommand);
}

if (Meteor.isClient) {
	RocketChat.callbacks.add('renderMessage', DecryptMessage, -9999, 'sharedsecret-decrypt-message');
	RocketChat.slashCommands.add('setsecretkey', HandleSlashCommandClient);
}
