// import cp from 'crypto-js';
// import download from 'downloadjs';
// const fs = require('fs');
// const btoa = require('btoa');



WebApp.connectHandlers.use('/ipfs', (req, res) => {
	// console.log(req);
	res.writeHead(200);
	// res.end(`Hello world from: ${ Meteor.release }`);
	const Hash = req.url.slice(1);
	console.log(Hash);
	const result = Meteor.call('getFile', Hash);
	console.log(`Rst ${ result }`);
	// Meteor.ClientCall.apply('12', 'test');

	// });
	// Meteor.call('test');
	res.write(result);
	// res.end();
	// fs.writeFile('testFile.txt', result, function(err) {
	// 	if (err) { throw err; }
	// 	console.log('Saved!');
	// });
	// res.download(result);


	// return result;
	// res.end();
	// if (result) {

	// console.log(key);
	// const getRst = cp.AES.decrypt(result, '$2b$10$p8KgyNBczTpCwluVD7.SGuwoortYp1MhfLNfyFXZkMYrWoSCVn5lq');
	// console.log(getRst);
	// console.log((getRst.toString(cp.enc.Utf8)));
	// console.log(btoa(unescape(encodeURIComponent(getRst))));
	// console.log(cp.enc.Utf8.stringify(getRst));

	// const end = (getRst.toString(cp.enc.Utf8)).indexOf(';');
	// const fileType = (getRst.toString(cp.enc.Utf8)).substring(5, end);
	// console.log(getRst.toString(cp.enc.Utf8));
	// console.log(`File Type${ fileType }`);
	// res.write(getRst.toString());
	// res.end();
	// 	if (fileType === 'image/jpeg') {
	// 		console.log('Loading');
	// 		const image = new Image();
	// 		image.src = getRst.toString(cp.enc.Utf8);
	// 		// req.write(image);
	// 		const w = window.open('');
	// 		w.document.write(image.outerHTML);
	// 	} else if ((fileType === 'application/pdf') || (fileType === 'text/plain')) {
	// 		if (fileType === 'application/pdf') {
	// 			ft = 'file.pdf';
	// 		} else {
	// 			ft = 'file.txt';
	// 		}
	// 		// var ext;
	// 		download(getRst.toString(cp.enc.Utf8), ft, fileType)
	// 			.then(function(file) {
	// 				console.log(file);
	// 			});
	// 	} else {
	// 		console.log('fail');
	// 	}
	// }
});
