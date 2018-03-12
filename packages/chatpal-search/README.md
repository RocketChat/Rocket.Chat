## Rocketchat Search

This module enables search for messages and other things within Rocket.Chat.
It provides the basic infrastructure for *Search Providers*, which enables everybody to easily add another
search (e.g. with special functions) to the Rocket.Chat infrastructure. In addition it provides a defautl implementation
based on MongoDB.

### Providers

A new Provider just extends the provider class and registers itself in the *SearchProviderService*.
```ecmascript 6
class MyProvider extends SearchProvider {
	constructor() {
		super('myProvider'); //a unique id for the provider
	};
	
	search(text, context, payload, callback) {
		//do some search and call the callback with the result
	};
}
```

### Settings
In order to enable Settings within the admin UI for your own provider, you can add it (e.g. in the constructor).
```ecmascript 6
this._settings.add('PageSize', 'int', 15, {
			i18nLabel: 'Search_Page_Size'
		});
```
The setting values are loaded, when you use your provider. The values can be easily accessed.
```ecmascript 6
this._settings.get('PageSize')
```

### Search UI
Search provider can have their own result template. The template is loaded with data.
```ecmascript 6
{
 searching, //reactive var if search results are loading
 result, //reactive var with the result 
 text, //reactive var with the search text
 settings //the settings of the provider,
 parentPayload, //the main search payload (not reset for new searches)
 payload, //the payload (reseted when new search is issed from search field)
 search //the search function
}
```

