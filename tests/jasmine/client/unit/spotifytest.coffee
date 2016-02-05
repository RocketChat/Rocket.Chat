describe 'Spotify integration', () ->
	describe 'Spotify id transformer', () ->
		it 'should transform track id to link and add it to message urls', () ->
			message = {'urls': [], 'msg': 'spotify:track:34AWo71Ya5gq7wpNnatwr7'}
			output = RocketChat.Spotify.transform message
			expect(output).toEqual {'urls':[{'url': 'https://open.spotify.com/track/34AWo71Ya5gq7wpNnatwr7', 'source':'spotify:track:34AWo71Ya5gq7wpNnatwr7'}], 'msg': 'spotify:track:34AWo71Ya5gq7wpNnatwr7'}

		it 'should transform artist id to link and add it to message urls', () ->
			message = {'urls': [], 'msg': 'spotify:artist:0OdUWJ0sBjDrqHygGUXeCF'}
			output = RocketChat.Spotify.transform message
			expect(output).toEqual {'urls':[{'url': 'https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF', 'source': 'spotify:artist:0OdUWJ0sBjDrqHygGUXeCF'}], 'msg': 'spotify:artist:0OdUWJ0sBjDrqHygGUXeCF'}

		it 'should transform album id to link and add it to message urls', () ->
			message = {'urls': [], 'msg': 'spotify:album:0sNOF9WDwhWunNAHPD3Baj'}
			output = RocketChat.Spotify.transform message
			expect(output).toEqual {'urls':[{'url': 'https://open.spotify.com/album/0sNOF9WDwhWunNAHPD3Baj', 'source': 'spotify:album:0sNOF9WDwhWunNAHPD3Baj'}], 'msg': 'spotify:album:0sNOF9WDwhWunNAHPD3Baj'}

		it 'should transform user playlist id to link and add it to message urls', () ->
			message = {'urls': [], 'msg': 'spotify:user:spotifybrazilian:playlist:4k7EZPI3uKMz4aRRrLVfen'}
			output = RocketChat.Spotify.transform message
			expect(output).toEqual {'urls':[{'url': 'https://open.spotify.com/user/spotifybrazilian/playlist/4k7EZPI3uKMz4aRRrLVfen', 'source': 'spotify:user:spotifybrazilian:playlist:4k7EZPI3uKMz4aRRrLVfen'}], 'msg': 'spotify:user:spotifybrazilian:playlist:4k7EZPI3uKMz4aRRrLVfen'}

		it 'should transform id to link even if wrapped around text', () ->
			message = {'urls': [], 'msg': 'a text before spotify:track:34AWo71Ya5gq7wpNnatwr7 a text after'}
			output = RocketChat.Spotify.transform message
			expect(output).toEqual {'urls':[{'url': 'https://open.spotify.com/track/34AWo71Ya5gq7wpNnatwr7', 'source':'spotify:track:34AWo71Ya5gq7wpNnatwr7'}], 'msg': 'a text before spotify:track:34AWo71Ya5gq7wpNnatwr7 a text after'}

		it 'should transform id to link and add it to message urls without erasing previous urls', () ->
			message = {'urls': [{'url': 'https://www.youtube.com/watch?v=_ze-sS61mCs'}], 'msg': 'https://www.youtube.com/watch?v=_ze-sS61mCs and spotify:track:34AWo71Ya5gq7wpNnatwr7'}
			output = RocketChat.Spotify.transform message
			expect(output).toEqual {'urls':[{'url': 'https://www.youtube.com/watch?v=_ze-sS61mCs'}, {'url': 'https://open.spotify.com/track/34AWo71Ya5gq7wpNnatwr7', 'source':'spotify:track:34AWo71Ya5gq7wpNnatwr7'}], 'msg': 'https://www.youtube.com/watch?v=_ze-sS61mCs and spotify:track:34AWo71Ya5gq7wpNnatwr7'}

		it 'should not apply transformation on links inside inline literal', () ->
			message = {'urls': [], 'msg': '`spotify:track:34AWo71Ya5gq7wpNnatwr7`'}
			output = RocketChat.Spotify.transform message
			expect(output).toEqual message

		it 'should not apply transformation on links inside code block', () ->
			message = {'urls': [], 'msg': '``` spotify:track:34AWo71Ya5gq7wpNnatwr7 ```'}
			output = RocketChat.Spotify.transform message
			expect(output).toEqual message

	describe 'Spotify id autolinker', () ->
		it 'should autolink spotify id', () ->
			message = RocketChat.Spotify.transform {'urls': [], 'msg': 'spotify:track:34AWo71Ya5gq7wpNnatwr7', 'html': 'spotify:track:34AWo71Ya5gq7wpNnatwr7'}
			output = RocketChat.Spotify.render message
			expect(output.html).toEqual '<a href="https://open.spotify.com/track/34AWo71Ya5gq7wpNnatwr7" target="_blank">spotify:track:34AWo71Ya5gq7wpNnatwr7</a>'

		it 'should autolink spotify id even if wrapped around text', () ->
			message = RocketChat.Spotify.transform {'urls': [], 'msg': 'a text before spotify:track:34AWo71Ya5gq7wpNnatwr7 a text after', 'html': 'a text before spotify:track:34AWo71Ya5gq7wpNnatwr7 a text after'}
			output = RocketChat.Spotify.render message
			expect(output.html).toEqual 'a text before <a href="https://open.spotify.com/track/34AWo71Ya5gq7wpNnatwr7" target="_blank">spotify:track:34AWo71Ya5gq7wpNnatwr7</a> a text after'
