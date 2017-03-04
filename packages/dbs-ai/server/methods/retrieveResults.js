Meteor.methods({
	'redlink:retrieveResults'(roomId, templateIndex, creator){
			const adapter = _dbs.RedlinkAdapterFactory.getInstance();
			results = adapter.getQueryResults(roomId, templateIndex, creator);

		return results;
		//
		// ein paar offline-fähige Testdaten
		// return [
		// {
		// 	"replySuggestion": "Sie können sich eine neue Bahncard zusenden lassen",
		// 	"offer": "38210",
		// 	"title": "Jugend <em>BahnCard</em> <em>25</em> ",
		// 	"categories": [
		// 		"BahnCard"
		// 	],
		// 	"body": "e Angaben in der endgültigen Jugend <em>BahnCard</em> <em>25</em> BC-Service anrufen und Zusendung einer neuen Jugend BC <em>25</em> veranlassen. Auffinden einer Jugend <em>BahnCard</em> <em>25</em> Gefundene Jugend <em>BahnCard</em> <em>25</em> an <em>BahnCard</em> Service senden  Umtausch/Erstattung Ausgeschlossen Auch der Umtausch einer <em>BahnCard</em> <em>25</em> Zusatz (Kind) in eine Jugend <em>BahnCard</em> <em>25</em> ist ausgeschlossen. Vergessene Jugend <em>BahnCard</em> <em>25</em> Verfahren analog <em>BahnCard</em> <em>25</em> Verlust der vorläufigen bzw. endgültigen Jugend BC <em>25</em> Keine Ersatzausstellung  Kunde kann eine neue Jugend <em>BahnCard</em> <em>25</em> zum Preis von 10 EUR erwerben  Hintergrundinfo Jugend <em>BahnCards</em> <em>25</em> werden ohne Passfoto ausgestellt und sind für Inhaber ab 16 Jahre im Zug nur mit einem amtlichen Lichtbildausweis gültig.  Die <em>BahnCard</em> Jugend <em>25</em> wird bei der Bestellung einer <em>BahnCard</em> <em>25</em> für Familien (Haupt- und Zusatzkarten) nicht als <em>BahnCard</em> <em>25</em> Zusatzkarte Kind anerkannt.  Der Jugend <em>BahnCard</em> <em>25</em>-Rabatt wird für Fahrkarten 1. und 2. Klasse gewährt Eine Kündigung ... <br> .... Jugend <em>BahnCard</em> <em>25</em> 4398 Muster Jugend <em>BahnCard</em> <em>25</em> ",
		// 	"link": "http://www.dbportal.db.de/scripts/cgiip.exe/VKL/Sichten/XMLAusgabe.w?RegelwerkNr=38210&AufrufVon=VKL&User=VKL",
		// 	"score": 221.85854,
		// 	"creator": "VKL",
		// 	"topic": "Produkt"
		// },
		// {
		// 	"replySuggestion": null,
		// 	"offer": "37974",
		// 	"title": "Probe <em>BahnCard</em> <em>25</em> ",
		// 	"categories": [
		// 		"BahnCard"
		// 	],
		// 	"body": "nCard <em>25</em> als Folge-<em>BahnCard</em> ist bereits beim Kauf der Probe <em>BahnCard</em> <em>25</em> der jeweils notwendige Nachweis erforderlich und entsprechend im Probe BC <em>25</em>-Bestellschein anzukreuzen  Umtausch/Erstattung Ausgeschlossen Kündigung Analog <em>BahnCard</em> <em>25</em> Vergessene Probe <em>BahnCard</em> <em>25</em> Analog <em>BahnCard</em> <em>25</em> Verlust der vorläufigen / endgültigen Probe <em>BahnCard</em> <em>25</em> Analog der regulärenBahnCard <em>25</em> über den <em>BahnCard</em>-Service gegen ein Entgelt von 15 EUR zugelassen ERV Verkauf der Versicherung nur zeitgleich beim Kauf der Probe <em>BahnCard</em> <em>25</em> zugelassen Ein nachträglicher Verkauf der Aktions- und Probe <em>BahnCard</em>-Versicherung ist ausgeschlossen Eingabehilfe Probe <em>BahnCard</em> <em>25</em>  Leistungskatalog  Klasse Leistungs-ID Vorl. Probe <em>BahnCard</em> <em>25</em> 2./1.Klasse 4369 Muster 2. Klasse 1. Klasse",
		// 	"link": "http://www.dbportal.db.de/scripts/cgiip.exe/VKL/Sichten/XMLAusgabe.w?RegelwerkNr=37974&AufrufVon=VKL&User=VKL",
		// 	"score": 221.68828,
		// 	"creator": "VKL",
		// 	"topic": "Produkt"
		// }
		// ];
		// return [
		// {
		// 	"replySuggestion": "Um 22:25  Uhr gibt es eine Verbindung von Frankfurt(Main)Hbf nach Paris Est. Du wärst dann um 07:50  dort.",
		// 	"departure": {
		// 		"location": "Frankfurt(Main)Hbf",
		// 		"time": "22:25 "
		// 	},
		// 	"arrival": {
		// 		"location": "Paris Est",
		// 		"time": "07:50 "
		// 	},
		// 	"dateChange": "+ 1 Tag",
		// 	"travelDuration": 565,
		// 	"travelChanges": 3,
		// 	"travelProducts": [
		// 		"RE",
		// 		"RE",
		// 		"TER",
		// 		"TGV"
		// 	],
		// 	"creator": "bahn.de",
		// 	"topic": "Reiseplanung"
		// },
		// {
		// 	"replySuggestion": "Um 02:48  Uhr gibt es eine Verbindung von Frankfurt(Main)Hbf nach Paris Est. Du wärst dann um 09:07  dort.",
		// 	"departure": {
		// 		"location": "Frankfurt(Main)Hbf",
		// 		"time": "02:48 "
		// 	},
		// 	"arrival": {
		// 		"location": "Paris Est",
		// 		"time": "09:07 "
		// 	},
		// 	"travelDuration": 379,
		// 	"travelChanges": 2,
		// 	"travelProducts": [
		// 		"IC",
		// 		"SWE",
		// 		"TGV"
		// 	],
		// 	"creator": "bahn.de",
		// 	"topic": "Reiseplanung"
		// }
		// ];
	}
});
