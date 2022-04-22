/**
 * This file is part of https://github.com/martynsmith/node-irc
 * by https://github.com/martynsmith
 */

module.exports = {
	'001': {
		name: 'rpl_welcome',
		type: 'reply',
	},
	'002': {
		name: 'rpl_yourhost',
		type: 'reply',
	},
	'003': {
		name: 'rpl_created',
		type: 'reply',
	},
	'004': {
		name: 'rpl_myinfo',
		type: 'reply',
	},
	'005': {
		name: 'rpl_isupport',
		type: 'reply',
	},
	'200': {
		name: 'rpl_tracelink',
		type: 'reply',
	},
	'201': {
		name: 'rpl_traceconnecting',
		type: 'reply',
	},
	'202': {
		name: 'rpl_tracehandshake',
		type: 'reply',
	},
	'203': {
		name: 'rpl_traceunknown',
		type: 'reply',
	},
	'204': {
		name: 'rpl_traceoperator',
		type: 'reply',
	},
	'205': {
		name: 'rpl_traceuser',
		type: 'reply',
	},
	'206': {
		name: 'rpl_traceserver',
		type: 'reply',
	},
	'208': {
		name: 'rpl_tracenewtype',
		type: 'reply',
	},
	'211': {
		name: 'rpl_statslinkinfo',
		type: 'reply',
	},
	'212': {
		name: 'rpl_statscommands',
		type: 'reply',
	},
	'213': {
		name: 'rpl_statscline',
		type: 'reply',
	},
	'214': {
		name: 'rpl_statsnline',
		type: 'reply',
	},
	'215': {
		name: 'rpl_statsiline',
		type: 'reply',
	},
	'216': {
		name: 'rpl_statskline',
		type: 'reply',
	},
	'218': {
		name: 'rpl_statsyline',
		type: 'reply',
	},
	'219': {
		name: 'rpl_endofstats',
		type: 'reply',
	},
	'221': {
		name: 'rpl_umodeis',
		type: 'reply',
	},
	'241': {
		name: 'rpl_statslline',
		type: 'reply',
	},
	'242': {
		name: 'rpl_statsuptime',
		type: 'reply',
	},
	'243': {
		name: 'rpl_statsoline',
		type: 'reply',
	},
	'244': {
		name: 'rpl_statshline',
		type: 'reply',
	},
	'250': {
		name: 'rpl_statsconn',
		type: 'reply',
	},
	'251': {
		name: 'rpl_luserclient',
		type: 'reply',
	},
	'252': {
		name: 'rpl_luserop',
		type: 'reply',
	},
	'253': {
		name: 'rpl_luserunknown',
		type: 'reply',
	},
	'254': {
		name: 'rpl_luserchannels',
		type: 'reply',
	},
	'255': {
		name: 'rpl_luserme',
		type: 'reply',
	},
	'256': {
		name: 'rpl_adminme',
		type: 'reply',
	},
	'257': {
		name: 'rpl_adminloc1',
		type: 'reply',
	},
	'258': {
		name: 'rpl_adminloc2',
		type: 'reply',
	},
	'259': {
		name: 'rpl_adminemail',
		type: 'reply',
	},
	'261': {
		name: 'rpl_tracelog',
		type: 'reply',
	},
	'265': {
		name: 'rpl_localusers',
		type: 'reply',
	},
	'266': {
		name: 'rpl_globalusers',
		type: 'reply',
	},
	'300': {
		name: 'rpl_none',
		type: 'reply',
	},
	'301': {
		name: 'rpl_away',
		type: 'reply',
	},
	'302': {
		name: 'rpl_userhost',
		type: 'reply',
	},
	'303': {
		name: 'rpl_ison',
		type: 'reply',
	},
	'305': {
		name: 'rpl_unaway',
		type: 'reply',
	},
	'306': {
		name: 'rpl_nowaway',
		type: 'reply',
	},
	'311': {
		name: 'rpl_whoisuser',
		type: 'reply',
	},
	'312': {
		name: 'rpl_whoisserver',
		type: 'reply',
	},
	'313': {
		name: 'rpl_whoisoperator',
		type: 'reply',
	},
	'314': {
		name: 'rpl_whowasuser',
		type: 'reply',
	},
	'315': {
		name: 'rpl_endofwho',
		type: 'reply',
	},
	'317': {
		name: 'rpl_whoisidle',
		type: 'reply',
	},
	'318': {
		name: 'rpl_endofwhois',
		type: 'reply',
	},
	'319': {
		name: 'rpl_whoischannels',
		type: 'reply',
	},
	'321': {
		name: 'rpl_liststart',
		type: 'reply',
	},
	'322': {
		name: 'rpl_list',
		type: 'reply',
	},
	'323': {
		name: 'rpl_listend',
		type: 'reply',
	},
	'324': {
		name: 'rpl_channelmodeis',
		type: 'reply',
	},
	'329': {
		name: 'rpl_creationtime',
		type: 'reply',
	},
	'331': {
		name: 'rpl_notopic',
		type: 'reply',
	},
	'332': {
		name: 'rpl_topic',
		type: 'reply',
	},
	'333': {
		name: 'rpl_topicwhotime',
		type: 'reply',
	},
	'341': {
		name: 'rpl_inviting',
		type: 'reply',
	},
	'342': {
		name: 'rpl_summoning',
		type: 'reply',
	},
	'351': {
		name: 'rpl_version',
		type: 'reply',
	},
	'352': {
		name: 'rpl_whoreply',
		type: 'reply',
	},
	'353': {
		name: 'rpl_namreply',
		type: 'reply',
	},
	'364': {
		name: 'rpl_links',
		type: 'reply',
	},
	'365': {
		name: 'rpl_endoflinks',
		type: 'reply',
	},
	'366': {
		name: 'rpl_endofnames',
		type: 'reply',
	},
	'367': {
		name: 'rpl_banlist',
		type: 'reply',
	},
	'368': {
		name: 'rpl_endofbanlist',
		type: 'reply',
	},
	'369': {
		name: 'rpl_endofwhowas',
		type: 'reply',
	},
	'371': {
		name: 'rpl_info',
		type: 'reply',
	},
	'372': {
		name: 'rpl_motd',
		type: 'reply',
	},
	'374': {
		name: 'rpl_endofinfo',
		type: 'reply',
	},
	'375': {
		name: 'rpl_motdstart',
		type: 'reply',
	},
	'376': {
		name: 'rpl_endofmotd',
		type: 'reply',
	},
	'381': {
		name: 'rpl_youreoper',
		type: 'reply',
	},
	'382': {
		name: 'rpl_rehashing',
		type: 'reply',
	},
	'391': {
		name: 'rpl_time',
		type: 'reply',
	},
	'392': {
		name: 'rpl_usersstart',
		type: 'reply',
	},
	'393': {
		name: 'rpl_users',
		type: 'reply',
	},
	'394': {
		name: 'rpl_endofusers',
		type: 'reply',
	},
	'395': {
		name: 'rpl_nousers',
		type: 'reply',
	},
	'401': {
		name: 'err_nosuchnick',
		type: 'error',
	},
	'402': {
		name: 'err_nosuchserver',
		type: 'error',
	},
	'403': {
		name: 'err_nosuchchannel',
		type: 'error',
	},
	'404': {
		name: 'err_cannotsendtochan',
		type: 'error',
	},
	'405': {
		name: 'err_toomanychannels',
		type: 'error',
	},
	'406': {
		name: 'err_wasnosuchnick',
		type: 'error',
	},
	'407': {
		name: 'err_toomanytargets',
		type: 'error',
	},
	'409': {
		name: 'err_noorigin',
		type: 'error',
	},
	'411': {
		name: 'err_norecipient',
		type: 'error',
	},
	'412': {
		name: 'err_notexttosend',
		type: 'error',
	},
	'413': {
		name: 'err_notoplevel',
		type: 'error',
	},
	'414': {
		name: 'err_wildtoplevel',
		type: 'error',
	},
	'421': {
		name: 'err_unknowncommand',
		type: 'error',
	},
	'422': {
		name: 'err_nomotd',
		type: 'error',
	},
	'423': {
		name: 'err_noadmininfo',
		type: 'error',
	},
	'424': {
		name: 'err_fileerror',
		type: 'error',
	},
	'431': {
		name: 'err_nonicknamegiven',
		type: 'error',
	},
	'432': {
		name: 'err_erroneusnickname',
		type: 'error',
	},
	'433': {
		name: 'err_nicknameinuse',
		type: 'error',
	},
	'436': {
		name: 'err_nickcollision',
		type: 'error',
	},
	'441': {
		name: 'err_usernotinchannel',
		type: 'error',
	},
	'442': {
		name: 'err_notonchannel',
		type: 'error',
	},
	'443': {
		name: 'err_useronchannel',
		type: 'error',
	},
	'444': {
		name: 'err_nologin',
		type: 'error',
	},
	'445': {
		name: 'err_summondisabled',
		type: 'error',
	},
	'446': {
		name: 'err_usersdisabled',
		type: 'error',
	},
	'451': {
		name: 'err_notregistered',
		type: 'error',
	},
	'461': {
		name: 'err_needmoreparams',
		type: 'error',
	},
	'462': {
		name: 'err_alreadyregistred',
		type: 'error',
	},
	'463': {
		name: 'err_nopermforhost',
		type: 'error',
	},
	'464': {
		name: 'err_passwdmismatch',
		type: 'error',
	},
	'465': {
		name: 'err_yourebannedcreep',
		type: 'error',
	},
	'467': {
		name: 'err_keyset',
		type: 'error',
	},
	'471': {
		name: 'err_channelisfull',
		type: 'error',
	},
	'472': {
		name: 'err_unknownmode',
		type: 'error',
	},
	'473': {
		name: 'err_inviteonlychan',
		type: 'error',
	},
	'474': {
		name: 'err_bannedfromchan',
		type: 'error',
	},
	'475': {
		name: 'err_badchannelkey',
		type: 'error',
	},
	'481': {
		name: 'err_noprivileges',
		type: 'error',
	},
	'482': {
		name: 'err_chanoprivsneeded',
		type: 'error',
	},
	'483': {
		name: 'err_cantkillserver',
		type: 'error',
	},
	'491': {
		name: 'err_nooperhost',
		type: 'error',
	},
	'501': {
		name: 'err_umodeunknownflag',
		type: 'error',
	},
	'502': {
		name: 'err_usersdontmatch',
		type: 'error',
	},
};
