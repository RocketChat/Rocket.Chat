
Template.chatops_droneflight.helpers
	flightMapOptions: ->
		if GoogleMaps.loaded()
			console.log('helper run')
			return {center: new google.maps.LatLng(35.6609285,-78.8456125), zoom: 17}


Template.chatops_droneflight.onCreated () ->
	GoogleMaps.ready 'flightMap', (map) ->
		console.log('ready')
		redicon = { path: google.maps.SymbolPath.CIRCLE, fillColor: "red", fillOpacity: 0.8, strokeColor: "gold", strokeWeight: 2, scale: 10}	
		greenicon = {path: google.maps.SymbolPath.CIRCLE, fillColor: "green", fillOpacity: 0.8, strokeColor: "gold", strokeWeight: 2, scale: 10}
	
		marker = new google.maps.Marker({position: new google.maps.LatLng(35.661848,-78.843165), icon: redicon,  map: map.instance})	
		marker.setLabel('1')
		marker2 = new google.maps.Marker({position: new google.maps.LatLng(35.660537,-78.846959), icon: greenicon, map: map.instance})	
		marker2.setLabel('2')
