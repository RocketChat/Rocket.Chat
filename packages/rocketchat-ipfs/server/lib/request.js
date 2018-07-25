import cp from 'crypto-js';
import download from 'downloadjs';


WebApp.connectHandlers.use('/ipfs', (req, res) => {
	res.writeHead(200);
	// res.end(`Hello world from: ${ Meteor.release }`);
	const Hash = req.url.slice(1);
	console.log(Hash);
	const result = Meteor.call('getFile', Hash);
	console.log("Rst "+result);
	if (result) {

		// console.log(key);
		const getRst = cp.AES.decrypt(result, Meteor.user().services.password.bcrypt);
		const end = (getRst.toString(cp.enc.Utf8)).indexOf(';');
		const fileType = (getRst.toString(cp.enc.Utf8)).substring(5, end);
		console.log(getRst.toString(cp.enc.Utf8));
		console.log(`File Type${ fileType }`);
		if (fileType === 'image/jpeg') {
			console.log('Loading');
			const image = new Image();
			image.src = getRst.toString(cp.enc.Utf8);
			const w = window.open('');
			w.document.write(image.outerHTML);
		} else if ((fileType === 'application/pdf') || (fileType === 'text/plain')) {
			if (fileType === 'application/pdf') {
				ft = 'file.pdf';
			} else {
				ft = 'file.txt';
			}
			// var ext;
			download(getRst.toString(cp.enc.Utf8), ft, fileType)
				.then(function(file) {
					console.log(file);
				});
		} else {
			console.log('fail');
		}
	}
});
