function Lend(command, params, item) {
	console.log(params);

	if (command !== 'lend' || !Match.test(params, String)) {
		return;
	}

	// source	string	Source address to use
	// destination	string	Destination bitcoin address or user:{username}
	// asset	string	Token to promise
	// quantity	integer	Amount, in satoshis
	// expiration	timestamp	Time that the promise expires, can be set to null
}

RocketChat.slashCommands.add('lend', Lend);
