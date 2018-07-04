
this.SpeechRecognition = new class {
	capitalize(s) {
		return s.replace(s.substr(0, 1), function(m) { return m.toUpperCase(); });
	}

	start(cb) {
		this.final_transcript = '';
		if ('webkitSpeechRecognition' in window) {
			const SpeechRecognitionProvider = window.webkitSpeechRecognition;
			this.recognition = new SpeechRecognitionProvider();
			this.recognition.continuous = true;

			this.recognition.onstart = () => {
				cb();
			};
			this.recognition.onerror = (event) => {
				console.log(event.error);
			};

			this.recognition.onresult = (event)=> {
				for (let i = event.resultIndex; i < event.results.length; ++i) {
					if (event.results[i].isFinal) {
						this.final_transcript += event.results[i][0].transcript;
					}
				}
				this.final_transcript = this.capitalize(this.final_transcript);
			};

			this.recognition.start();
		}
	}

	stop(cb) {
		this.recognition.onend = () => {
			if (cb) {
				cb(this.final_transcript);
			}
		};
		this.recognition.stop();
	}
};

