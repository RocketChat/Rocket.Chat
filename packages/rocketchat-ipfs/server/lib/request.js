WebApp.connectHandlers.use('/hello', (req, res) => {
	res.writeHead(200);
	res.end(`Hello world from: ${ Meteor.release }`);
	Meteor.call('test');
});
