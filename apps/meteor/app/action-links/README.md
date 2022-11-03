RocketChat Action Links
============

Action Links are a way to add custom javascript functions to RocketChat messages. The links appear as a horizontal list below the message they correspond to, and by clicking the link will run a function you define server-side. 

Usage
------------

Add 'actionLinks' to any message object as in the example below. It should be an array of object, each containing a 'label' (this will be the text printed to click on), a method_id (this is the name of the method that will be run), and params (this is the parameters passed to the method_id function).

~~~
message.actionLinks = [{ label: "Another Option", method_id: "anotherFunction", params: "stuff"}, { label: "An Option", method_id: "functOne", params: ""}];
~~~





The functions to be run need to be added to the actionLinkFuncts namespace. This is done by calling the RocketChat.actionLinks.register method. Your custom functions should take two parameters: the original message from the database, and the 'params' object given for that function.
~~~
RocketChat.actionLinks.register('functOne', function (origDbMsg, params) {
		
	console.log("I did some stuff!");

});
~~~
