@PhoneTones = class Tone
	constructor: (@context, @freq1, @freq2) ->
		@status = 0
		@dtmfFrequencies =
			"1": {f1: 697, f2: 1209},
			"2": {f1: 697, f2: 1336},
			"3": {f1: 697, f2: 1477},
			"4": {f1: 770, f2: 1209},
			"5": {f1: 770, f2: 1336},
			"6": {f1: 770, f2: 1477},
			"7": {f1: 852, f2: 1209},
			"8": {f1: 852, f2: 1336},
			"9": {f1: 852, f2: 1477},
			"*": {f1: 941, f2: 1209},
			"0": {f1: 941, f2: 1336},
			"#": {f1: 941, f2: 1477}

		@ringerLFOSource = null

	setup: (f1, f2) ->
		f1 = f1 or @freq1
		f2 = f2 or @freq2
		@osc1 = @context.createOscillator()
		@osc2 = @context.createOscillator()
		@osc1.frequency.value = f1
		@osc2.frequency.value = f2

		@gainNode = @context.createGain()
		@gainNode.gain.value = 0.25

		@filter = @context.createBiquadFilter()
		@filter.type = "lowpass"
		@filter.frequency = 8000

		@osc1.connect(@gainNode)
		@osc2.connect(@gainNode)
		@gainNode.connect(@filter)
		@filter.connect(@context.destination)

	start: (f1, f2) ->
		if @status == 1
			return
		@setup(f1, f2)
		@osc1.start(0)
		@osc2.start(0)
		@status = 1

	stop: () ->
		if @status == 0
			return
		@osc1?.stop(0)
		@osc2?.stop(0)
		@ringerLFOSource?.stop(0)
		@status = 0

	startDtmf: (key) ->
		f = @dtmfFrequencies[key]
		if f and f.f1 and f.f2
			@start(f.f1, f.f2)

	createRingerLFO: (country) ->
		mapper =
			'it': @_createRingerLFOIt
			'uk': @_createRingerLFOUk
		method = mapper[country] or @_createRingerLFOIt
		method()

	_createItRingerLFO: () ->
		@_createRingerLFO 5, (t) -> (t > 0 and t < 1)

	_createUkRingerLFO: () ->
		@_createRingerLFO 3, (t) -> ((t > 0 and t < 0.4) or (t > 0.6 and t < 1))

	_createRingerLFO: (duration, condition) ->
		# create audio buffer
		channels = 1
		sampleRate = @context.sampleRate
		frameCount = sampleRate * duration   # duration seconds long
		arrayBuffer = @context.createBuffer(channels, frameCount, sampleRate)

		bufferData = arrayBuffer.getChannelData(0)
		for i in [0..frameCount-1]
			# activate only in the [0, 0.4] and [0.6, 1] intervals
			if condition(i/sampleRate)
				bufferData[i] = 0.25

		@ringerLFOBuffer = arrayBuffer

	_startRingback: (f1, f2, ringerBuffer) ->
		@start(f1, f2)

		# set our gain node to 0, because the LFO is calibrated to this level
		@gainNode.gain.value = 0

		@ringerLFOSource = @context.createBufferSource()
		@ringerLFOSource.buffer = ringerBuffer
		@ringerLFOSource.loop = true
		# connect the ringerLFOSource to the gain Node audio param
		@ringerLFOSource.connect(@gainNode.gain)
		@ringerLFOSource.start(0)

	startRingback: (country) ->
		country = country?.toLowerCase() or 'it'
		capitalizedCountry = country[0].toUpperCase() + country.slice(1)
		mapper =
			it: {f1: 425, f2: 0, ringerbuf_method: @_createItRingerLFO}
			uk: {f1: 400, f2: 450, ringerbuf_method: @_createUkRingerLFO}
		ringerBuffer = @["_create#{capitalizedCountry}RingerLFO"]()
		params = mapper[country]
		@_startRingback params.f1, params.f2, ringerBuffer
