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
		if status == 1
			return
		@setup(f1, f2)
		@osc1.start(0)
		@osc2.start(0)
		@status = 1

	stop: () ->
		if status == 0
			return
		@osc1.stop(0)
		@osc2.stop(0)
		@ringerLFOSource?.stop(0)
		@status = 0

	startDtmf: (key) ->
		f = @dtmfFrequencies[key]
		if f and f.f1 and f.f2
			@start(f.f1, f.f2)

	createRingerLFO: () ->
		# create audio buffer
		channels = 1
		sampleRate = @context.sampleRate
		frameCount = sampleRate * 5   # 5 seconds long
		arrayBuffer = @context.createBuffer(channels, frameCount, sampleRate)

		bufferData = arrayBuffer.getChannelData(0)
		for i in [0..frameCount-1]
			# activate only in the first second
			if i/sampleRate > 0 and i/sampleRate < 1
				bufferData[i] = 0.25

		@ringerLFOBuffer = arrayBuffer

	startRingback: () ->
		@start(425, 0)

		# set our gain node to 0, because the LFO is calibrated to this level
		@gainNode.gain.value = 0

		ringerBuffer = @createRingerLFO()

		@ringerLFOSource = @context.createBufferSource()
		@ringerLFOSource.buffer = ringerBuffer
		@ringerLFOSource.loop = true
		# connect the ringerLFOSource to the gain Node audio param
		@ringerLFOSource.connect(@gainNode.gain)
		@ringerLFOSource.start(0)
