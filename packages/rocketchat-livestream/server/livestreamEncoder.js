const ffmpeg = require('fluent-ffmpeg');
const wss = require('websocket-stream');
import ws from 'ws';
const WebSocketServer = new ws.Server({port: 3001});

/*
VBR="2500k"                                    # Bitrate de la vidéo en sortie
FPS="30"                                       # FPS de la vidéo en sortie
QUAL="medium"                                  # Preset de qualité FFMPEG
YOUTUBE_URL="rtmp://a.rtmp.youtube.com/live2"  # URL de base RTMP youtube

SOURCE="default"              # Source UDP (voir les annonces SAP)
KEY="x60x-0wyw-51j8-66tf"                                     # Clé à récupérer sur l'event youtube

ffmpeg \
    -f avfoundation -i "default" -deinterlace \
    -f lavfi -i anullsrc \
    -vcodec libx264 -pix_fmt yuv422p -preset $QUAL -r $FPS -g $(($FPS * 2)) -b:v $VBR \
    -acodec libmp3lame -ar 44100 -threads 6 -q:v 3 -b:a 712000 -bufsize 4000k -maxrate 960k \
    -f flv "$YOUTUBE_URL/$KEY"
*/
WebSocketServer.on('connection', function(websocket) {
	const stream = wss(websocket);
	ffmpeg()
		.input(stream)
		.videoCodec('libx264')
		.audioCodec('libmp3lame')
		.outputFPS(30)
		.addOption('-ar', 44100)
		.addOption('-g', 60)
		.addOption('-crf', 18)
		.addOption('-pix_fmt', 'yuv420p')
		.addOption('-threads', 6)
		.addOption('-q:v', 3)
		.addOption('-movflags', 'flagstart')
		.addOption('-b:a', '384k')
		.addOption('-maxrate', '750k')
		.addOption('-bufsize', '3000k')
		.addOption('-f', 'flv')
		.on('error', function(err) {
			console.log(`Error: ${ err.message }`);
		})
		.save('rtmp://a.rtmp.youtube.com/live2/x60x-0wyw-51j8-66tf', function(stdout) {
			console.log(`Convert complete${ stdout }`);
		});
});
