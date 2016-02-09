atoy40:accounts-cas
===================

CAS login support.

## Usage

put CAS settings in Meteor.settings (for exemple using METEOR_SETTINGS env or --settings) like so:

```
"cas": {
	"baseUrl": "https://sso.univ-pau.fr/cas/",
 	"autoClose": true
},
"public": {
	"cas": {
		"loginUrl": "https://sso.univ-pau.fr/cas/login",
		"serviceParam": "service",
		"popupWidth": 810,
		"popupHeight": 610
	}
}
```

Then, to start authentication, you have to call the following method from the client (for example in a click handler) :

```
Meteor.loginWithCas([callback]);
```

It must open a popup containing you CAS login from. The popup will be close immediately if you are already logged with your CAS server.
