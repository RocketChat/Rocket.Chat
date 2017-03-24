export class ClientResultFactory {
	getInstance(creator, endpointUrl) {
		switch (creator) {
			case 'dbsearch':
				return new SolrProvider(creator, endpointUrl);
		}
	}
}

class SolrProvider {
	constructor(creator, endpointUrl) {
		this.creator = creator;
		this.endpointUrl = endpointUrl;
	}

	/**
	 * Executes an asynchronous data retrieval and hands it over to the callback as single parameter
	 * @return Promise
	 */
	executeSearch(queryParameters) {
		let customSuffix = RocketChat.settings.get('Assistify_AI_DBSearch_Suffix') || "";
		customSuffix = customSuffix.replace(/\r\n|\r|\n/g, '');
		console.log("executeSearch " + this.endpointUrl + customSuffix);
		return new Promise(function (resolve, reject) {
			if(mock) {
				resolve(SolrProvider.transformResponse(mockData));
			} else {
				$.ajax({
					url: this.endpointUrl + customSuffix,
					dataType: "jsonp",
					jsonp: 'json.wrf',
					success: function (data) {
						resolve(SolrProvider.transformResponse(data));
					},
					error: function(error){
						reject(new Error('no-dbsearch-result'));
					}
				});
			}
		})
	}

	static transformResponse(data) {
		for (var j = 0; j < data.response.docs.length; j++) {
			var doc = data.response.docs[j];
			var hl = data.highlighting[doc.id];
			var results = new Array();
			var body;
			if (hl && hl['dbsearch_highlight_t_de'] && hl['dbsearch_highlight_t_de'].length > 0) {
				body = hl['dbsearch_highlight_t_de'];
			} else {
				body = [ doc.dbsearch_excerpt_s ];
			}
			for (var i = 0; i < body.length; i++) {
				var message = {
					content: body[i],
					user: {
						displayName: 'provider'
					}
				};
				results.push(message);
			}
			doc['body'] = results;
		}
		console.log(data);
		return data;
	}
}

let mock = false;
//temporär wenn nicht im Intranet: JSON statisch erzeugen
var mockData = {
	"responseHeader": {
		"status": 0,
		"QTime": 1431,
		"params": {
			"facet.field": ["{!ex=selSource}dbsearch_source_path", "{!ex=selAuthor}dbsearch_author_ss", "{!ex=selKeywords}dbsearch_keywords_ss", "{!ex=selType}dbsearch_content_type_aggregated_s"],
			"f.dbsearch_source_path.facet.limit": "-1",
			"AuthenticatedUserDomain": "BKU",
			"AuthenticatedUserName": "ruedigerkurz|Ruediger.Kurz@deutschebahn.com",
			"json.nl": "map",
			"f.dbsearch_author_ss.facet.limit": "20",
			"boostlang": "de",
			"dbsearch_prefilter": "true",
			"rows": "8",
			"facet.query": ["{!key=all ex=dateFacet}id:*", "{!key=last_day ex=dateFacet}dbsearch_pub_date_tdt:[NOW-1DAY TO *]", "{!key=last_week ex=dateFacet}dbsearch_pub_date_tdt:[NOW-7DAYS TO *]", "{!key=last_month ex=dateFacet}dbsearch_pub_date_tdt:[NOW-1MONTH TO *]", "{!key=last_year ex=dateFacet}dbsearch_pub_date_tdt:[NOW-1YEAR TO *]", "{!key=older ex=dateFacet}dbsearch_pub_date_tdt:[* TO NOW-1YEAR]", "{!key=missing ex=dateFacet}-dbsearch_pub_date_tdt:[* TO *]"],
			"mcf": "true",
			"f.dbsearch_keywords_ss.facet.limit": "20",
			"q": "test",
			"json.wrf": "jQuery221010457950976332464_1489574282541",
			"f.dbsearch_author_ss.facet.missing": "true",
			"dbsearch_context": "dbsearch",
			"facet": "true",
			"wt": "json"
		}
	},
	"securityStatus": "ok",
	"response": {
		"numFound": 139378,
		"start": 0,
		"docs": [{
			"dbsearch_mod_date_tdt": "2017-03-01T10:44:11Z",
			"dbsearch_source_name_s": "Wiki-Pool DB Systel",
			"dbsearch_space_id_s": "eq2016",
			"dbsearch_source_type_s": "confluence",
			"id": "https://dbsystel.wiki.intranet.deutschebahn.com/wiki/pages/viewpage.action?pageId=57855715",
			"dbsearch_pub_date_tdt": "2017-03-01T09:58:18Z",
			"dbsearch_space_name_t": "Einstiegsqualifizierung DB Systel",
			"dbsearch_content_type_s": "text/html",
			"dbsearch_content_type_aggregated_s": "html",
			"dbsearch_keywords_txt": ["test"],
			"dbsearch_link_s": "https://dbsystel.wiki.intranet.deutschebahn.com/wiki/pages/viewpage.action?pageId=57855715",
			"dbsearch_doctype_s": "Document",
			"dbsearch_author_t": "Mohammad-Sharif Moradi",
			"dbsearch_content_size_l": 554,
			"dbsearch_title_s": "EQ-Praktikanten bei der DB Systel",
			"dbsearch_excerpt_s": "† Einstiegsqualifizierung (EQ): Berichte Was bedeutet EQ Praktikum†Programm? Einstiegsqualifizierung Programm ist eine Mˆglichkeit, Chance und Zugang †f¸r junge†Menschen mit Migrationshintergrund. Es",
			"dbsearch_language_s": "de",
			"[elevated]": false
		}, {
			"dbsearch_source_type_s": "sharepoint",
			"dbsearch_source_name_s": "TIKA",
			"dbsearch_pub_date_tdt": "2017-03-10T15:04:30Z",
			"dbsearch_content_type_s": "application/pdf",
			"dbsearch_content_type_aggregated_s": "pdf",
			"dbsearch_space_id_s": "Muster WA / WA Example",
			"id": "https://m00014.sharepoint.noncd.rz.db.de/workingareas/musterwawaexample/Documents/Projekt%202/Test%20Anna%2023.pdf",
			"dbsearch_space_name_t": "Muster WA / WA Example",
			"dbsearch_content_size_l": 85588,
			"dbsearch_mod_date_tdt": "2017-03-10T15:04:30Z",
			"dbsearch_link_s": "https://tika.sharepoint.noncd.rz.db.de/workingareas/musterwawaexample/Documents/Projekt%202/Test%20Anna%2023.pdf",
			"dbsearch_title_s": "Test Anna 23",
			"dbsearch_classifier_ss": ["gassc"],
			"dbsearch_extracted_pub_date_tdt": "2017-03-10T15:04:01Z",
			"dbsearch_extracted_mod_date_tdt": "2017-03-10T15:04:01Z",
			"dbsearch_excerpt_s": "Test Anna 23 Anna 01.03.2017 Mit Kommentaren am 10.03.2017 Und noch mehr Kommentare am 10.03.2017",
			"dbsearch_language_s": "de",
			"dbsearch_doctype_s": "Document",
			"[elevated]": false
		}, {
			"dbsearch_source_type_s": "sharepoint",
			"dbsearch_source_name_s": "TIKA",
			"dbsearch_pub_date_tdt": "2017-03-10T15:03:05Z",
			"dbsearch_content_type_s": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"dbsearch_content_type_aggregated_s": "msword",
			"dbsearch_space_id_s": "Muster WA / WA Example",
			"id": "https://m00014.sharepoint.noncd.rz.db.de/workingareas/musterwawaexample/Documents/Projekt%202/Test%20Anna%2023.docx",
			"dbsearch_space_name_t": "Muster WA / WA Example",
			"dbsearch_content_size_l": 21276,
			"dbsearch_mod_date_tdt": "2017-03-10T15:03:05Z",
			"dbsearch_link_s": "https://tika.sharepoint.noncd.rz.db.de/workingareas/musterwawaexample/Documents/Projekt%202/Test%20Anna%2023.docx",
			"dbsearch_title_s": "Test Anna 23",
			"dbsearch_classifier_ss": ["gassc"],
			"dbsearch_extracted_pub_date_tdt": "2015-12-04T11:25:00Z",
			"dbsearch_extracted_mod_date_tdt": "2017-03-10T15:02:47Z",
			"dbsearch_excerpt_s": "Test Anna 23 Anna 01.03.2017 Mit Kommentaren am 10.03.2017 Und noch mehr Kommentare am 10.03.2017",
			"dbsearch_language_s": "de",
			"dbsearch_doctype_s": "Document",
			"[elevated]": false
		}, {
			"dbsearch_mod_date_tdt": "2017-03-01T12:21:09Z",
			"dbsearch_source_name_s": "Athene",
			"dbsearch_source_type_s": "Athene",
			"id": "https://athene.intranet.deutschebahn.com/athene/livelink?func=ll&objAction=overview&objID=25748005",
			"dbsearch_pub_date_tdt": "2017-03-01T12:21:09Z",
			"dbsearch_content_type_s": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"dbsearch_content_type_aggregated_s": "mspowerpoint",
			"dbsearch_link_s": "https://athene.intranet.deutschebahn.com/athene/livelink?func=ll&objAction=overview&objID=25748005",
			"dbsearch_content_size_l": 241520,
			"dbsearch_title_s": "Umgebungen - Instanzen.pptx",
			"dbsearch_extracted_title_s": "Test",
			"dbsearch_extracted_pub_date_tdt": "2005-02-21T07:36:49Z",
			"dbsearch_extracted_mod_date_tdt": "2017-03-01T12:20:34Z",
			"dbsearch_excerpt_s": "DB Systel GmbH | PAISY-Point | I.LPA 54 | 13.07.2016 PAISY CS Umgebungen ñ Instanzen Teilweise freigegeben Hinweis: F¸r externe Pr‰sentationen bitte immer eine Titelfolie mit der Ressort-Farbe",
			"dbsearch_language_s": "de",
			"dbsearch_doctype_s": "Document",
			"[elevated]": false
		}, {
			"dbsearch_mod_date_tdt": "2017-02-22T14:28:03Z",
			"dbsearch_source_name_s": "Wiki-Pool DB Systel",
			"dbsearch_space_id_s": "dbsystel",
			"dbsearch_source_type_s": "confluence",
			"id": "https://dbsystel.wiki.intranet.deutschebahn.com/wiki/pages/viewpage.action?pageId=57850201",
			"dbsearch_pub_date_tdt": "2017-02-22T14:14:28Z",
			"dbsearch_space_name_t": "DB Systel Wiki",
			"dbsearch_content_type_s": "text/html",
			"dbsearch_content_type_aggregated_s": "html",
			"dbsearch_keywords_txt": ["test", "protokoll"],
			"dbsearch_link_s": "https://dbsystel.wiki.intranet.deutschebahn.com/wiki/pages/viewpage.action?pageId=57850201",
			"dbsearch_doctype_s": "Document",
			"dbsearch_author_t": "Peter Markwart",
			"dbsearch_content_size_l": 5798,
			"dbsearch_title_s": "D.IPB 44 - Protokoll - Abteilungsmeeting 22.02.17",
			"dbsearch_excerpt_s": "† † † † Seitennavigation >>† Meetings und Protokolle der D.IPB 44 † Allgemeine Daten Thema des Meetings Abteilungsmeeting Datum 22.02.2017 Zeitraum 13:30 - 14:30 Uhr Ort Silberturm J02 03 Teilnehmer",
			"dbsearch_language_s": "de",
			"[elevated]": false
		}, {
			"dbsearch_mod_date_tdt": "2017-01-26T09:52:08Z",
			"dbsearch_source_name_s": "Wiki-Pool DB Systel",
			"dbsearch_space_id_s": "dbsystel",
			"dbsearch_source_type_s": "confluence",
			"id": "https://dbsystel.wiki.intranet.deutschebahn.com/wiki/pages/viewpage.action?pageId=56552993",
			"dbsearch_pub_date_tdt": "2017-01-26T09:30:16Z",
			"dbsearch_space_name_t": "DB Systel Wiki",
			"dbsearch_content_type_s": "text/html",
			"dbsearch_content_type_aggregated_s": "html",
			"dbsearch_keywords_txt": ["test", "protokoll"],
			"dbsearch_link_s": "https://dbsystel.wiki.intranet.deutschebahn.com/wiki/pages/viewpage.action?pageId=56552993",
			"dbsearch_doctype_s": "Document",
			"dbsearch_author_t": "Peter Markwart",
			"dbsearch_content_size_l": 6318,
			"dbsearch_title_s": "D.IPB 44 - Protokoll - Abteilungsmeeting 25.01.17",
			"dbsearch_excerpt_s": "† † † † Seitennavigation >>† Meetings und Protokolle der D.IPB 44 † Allgemeine Daten Thema des Meetings Abteilungsmeeting Datum 25.01.2017 Zeitraum 13:30 - 15:30 Uhr Ort Silberturm J02 03 Teilnehmer",
			"dbsearch_language_s": "de",
			"[elevated]": false
		}, {
			"dbsearch_mod_date_tdt": "2017-01-27T15:34:56Z",
			"dbsearch_source_name_s": "Athene",
			"dbsearch_source_type_s": "Athene",
			"id": "https://athene.intranet.deutschebahn.com/athene/livelink?func=ll&objAction=overview&objID=27775601",
			"dbsearch_pub_date_tdt": "2017-01-27T15:34:56Z",
			"dbsearch_content_type_s": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"dbsearch_content_type_aggregated_s": "mspowerpoint",
			"dbsearch_link_s": "https://athene.intranet.deutschebahn.com/athene/livelink?func=ll&objAction=overview&objID=27775601",
			"dbsearch_content_size_l": 871516,
			"dbsearch_title_s": "170126 - Info GBR Vertrieb Status KFMS.pptx",
			"dbsearch_extracted_title_s": "Test",
			"dbsearch_extracted_pub_date_tdt": "2005-02-21T07:36:49Z",
			"dbsearch_extracted_mod_date_tdt": "2017-01-27T07:45:52Z",
			"dbsearch_excerpt_s": "Zukunft Bahn Projekt Kundenfeedbackmanagement 30.01.2017 Hinweis: ÑVielen Dank f¸r Ihre Aufmerksamkeitì kann auch durch ein anderes Abschlusszitat oder eine Botschaft ersetzt werden. 1 ‹bergang ZuBa",
			"dbsearch_language_s": "de",
			"dbsearch_doctype_s": "Document",
			"[elevated]": false
		}, {
			"dbsearch_mod_date_tdt": "2017-01-26T13:40:31Z",
			"dbsearch_source_name_s": "Athene",
			"dbsearch_source_type_s": "Athene",
			"id": "https://athene.intranet.deutschebahn.com/athene/livelink?func=ll&objAction=overview&objID=27761612",
			"dbsearch_pub_date_tdt": "2017-01-26T13:40:31Z",
			"dbsearch_content_type_s": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"dbsearch_content_type_aggregated_s": "mspowerpoint",
			"dbsearch_link_s": "https://athene.intranet.deutschebahn.com/athene/livelink?func=ll&objAction=overview&objID=27761612",
			"dbsearch_content_size_l": 1166289,
			"dbsearch_title_s": "170124 - 7. Review Board gezeigte Version.pptx",
			"dbsearch_extracted_title_s": "Test",
			"dbsearch_extracted_pub_date_tdt": "2005-02-21T07:36:49Z",
			"dbsearch_extracted_mod_date_tdt": "2017-01-25T07:30:10Z",
			"dbsearch_excerpt_s": "Zukunft Bahn Projekt Kundenfeedbackmanagement 7. Review Board Projekt Kundenfeedbackmanagement 24.01.2017 Hinweis: ÑVielen Dank f¸r Ihre Aufmerksamkeitì kann auch durch ein anderes Abschlusszitat",
			"dbsearch_language_s": "de",
			"dbsearch_doctype_s": "Document",
			"[elevated]": false
		}]
	},
	"highlighting": {
		"https://dbsystel.wiki.intranet.deutschebahn.com/wiki/pages/viewpage.action?pageId=57855715": {},
		"https://m00014.sharepoint.noncd.rz.db.de/workingareas/musterwawaexample/Documents/Projekt%202/Test%20Anna%2023.pdf": {"dbsearch_highlight_t_de": ["<strong>Test</strong> Anna 23 Anna 01.03.2017 Mit Kommentaren am 10.03.2017 Und noch mehr Kommentare am 10.03.2017"]},
		"https://m00014.sharepoint.noncd.rz.db.de/workingareas/musterwawaexample/Documents/Projekt%202/Test%20Anna%2023.docx": {"dbsearch_highlight_t_de": ["<strong>Test</strong> Anna 23 Anna 01.03.2017 Mit Kommentaren am 10.03.2017 Und noch mehr Kommentare am 10.03.2017"]},
		"https://athene.intranet.deutschebahn.com/athene/livelink?func=ll&objAction=overview&objID=25748005": {"dbsearch_highlight_t_de": ["f¸r das <strong>Testen</strong> der Funktionsf‰higkeit nach einem Betriebssystem-Update angelegt. tempor‰r f¸r <strong>Test</strong> Para", "&#x2F;app&#x2F;paisycs&#x2F;archiv&#x2F;bin&#x2F;create_baseline P14B N+10y # <strong>TMT</strong> 697 Testlauf Verzeichnispflege Output_SST_archiv"]},
		"https://dbsystel.wiki.intranet.deutschebahn.com/wiki/pages/viewpage.action?pageId=57850201": {"dbsearch_highlight_t_de": ["Teilnehmer † Agenda des Meetings Begr¸ﬂung CA <strong>Test</strong> ZPM <strong>Test</strong> Vorstellung neuer MA (Alexander Hitz) Offene", "Protokollpunkt ToDos Verantwortlich Endtermin 1 Stand CA <strong>Test</strong> Bereitstellen Markwart 22.02.2017 2 Stand ZPM Test"]},
		"https://dbsystel.wiki.intranet.deutschebahn.com/wiki/pages/viewpage.action?pageId=56552993": {"dbsearch_highlight_t_de": ["Kurzinfo MAB Folgeworkshops (Christina Herweg) CA <strong>Test</strong> Vorstellung Neuer Mitarbeiter (Hossein Rabighomi", "nkt ToDos Verantwortlich Endtermin 1 Roadmap CA <strong>Test</strong> 2017 Bereitstellen Markwart 26.01.2017 2 Informationen"]},
		"https://athene.intranet.deutschebahn.com/athene/livelink?func=ll&objAction=overview&objID=27775601": {},
		"https://athene.intranet.deutschebahn.com/athene/livelink?func=ll&objAction=overview&objID=27761612": {}
	}
};
