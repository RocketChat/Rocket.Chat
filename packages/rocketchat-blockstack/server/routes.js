Picker.route('/_blockstack/manifest', (params, req, res) => {
	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*'
	});
	const name = RocketChat.settings.get('Site_Name');
	const startUrl = Meteor.absoluteUrl();
	const description = RocketChat.settings.get('Blockstack_Auth_Description');
	const iconUrl = Meteor.absoluteUrl('assets/favicon_192');
	res.end(`{
    "name": "${ name }",
    "start_url": "${ startUrl }",
    "description": "${ description }",
    "icons": [{
      "src": "${ iconUrl }",
      "sizes": "192x192",
      "type": "image/png"
    }]
	}`);
});
