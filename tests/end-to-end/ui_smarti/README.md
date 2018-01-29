## Rocket.Chat test environment
	*	Tests are written in mocha-js (https://mochajs.org)
	*	Tests are separated in api- and ui- tests
	*	Api tests use supertest framework for requests
	*	Ui tests use phantomjs as headless browser or chrome-driver for live testing
## Test filestructure:
tests
  data
  end-to-end
    api
    ui
    ui_smarti
  pageobjects
The data folder includes all files for static test information such as login-data or channel-names. The end-to-end directory includes all test files. It is seperated in api and ui tests. The pageobjects folder consists of static variables used for the ui tests to interact with the ui browser elements.

## Smarti - Rocket.Chat end to end tests
The Smarti end-to-end tests are divided into three modules. The first file '00-preparation.js' is a first api test to setup Smarti. The following steps are tested:
	*	is Smarti running?
	*	does Smarti system info exists?
	*	does any client exists?
	*	if no client exists create a new client
	*	check if new client has the right id
	*	insert query-builder config for the client
	* 	post access-token to the client
	*	login to Rocket.Chat Rest-API
	*	configure assistify settings in Rocket.Chat
	*	logout from Rocket.Chat Rest-API
When the setup is successful the connection between Rocket.Chat and Smarti will be testet in a ui test '01-integration.js'. The tests consists of the following steps:
	*	login to Rocket.Chat as admin
	*	create new topic in Rocket.Chat
	*	switch to the general Channel and back to the newly created topic
	*	send a message in the topic
	*	create a first request for the topic
	*	send a message in the first request
	*	close the first request
	*	create a second request
	*	send the same message as in the first request
	*	check the knowledgebase for a result, based on the first request
	*	post the first available result from the knowledgebase
	*	remove created topic.
When all integration tests run through, the Smarti test environment will be cleaned up to avoid inconsistent data during test retries.
The cleanup is done in a third test file '02-cleanup.js':
	*	get client id from Smarti
	*	delete the client from Smarti
	*	logout of Rocket.Chat
## Running tests locally
To run tests locally the TEST_MODE=true flag has to be set on the startup of rocket.chat. Before running the tests a rocket.chat instance has to run in TEST_MODE. Run tests by using the following command: “meteor npm run chimp-test” The tests use the real mongodb instance. If any errors happen in the tests try to drop the database and restart rocket.chat Mongodb is running on port 3001 by default.

## How to create a new end-to-end test for Smarti and Rocket.Chat
Before running ui tests make sure that Smarti is running (see '00-preparation.js') and have a before step in the test-environment that is logging a user into Rocket.Chat. Logging into Rocket.Chat is provided by a function in the 'data/checks.js' file:
	*	checkIfUserIsValid to login as an user
	*	checkIfUserIsAdmin to login as an admin
To create new topics or requests use the functions provided in the 'pageobjects/assitify.page.js' file:
	*	createTopic to create a new topic with a specified name (only available as admin user)
	*	createHelpRequest to create a new request
	*	sendTopicMessage to send a message in a topic or request
	*	closeRequest to close a request via the knowledgebase
	*	closeTopic to remove a topic
	*	clickKnowledgebase to open the knowledgebase tab
	*	logoutRocketchat to logout from Rocket.Chat
