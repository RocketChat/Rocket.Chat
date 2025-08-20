import { Box, Button, Icon, Select } from '@rocket.chat/fuselage';
import { ChangeEvent, FC, Key, useEffect, useRef, useState } from 'react';

const formatTime = (timeInSeconds: number): string => {
  if (!Number.isFinite(timeInSeconds)) {
    return '00:00';
  }
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
};

interface CustomAudioPlayerProps {
  src: string;
  type?: string;
  downloadUrl?: string;
  onDownloadClick?: () => void;
}

const CustomAudioPlayer: FC<CustomAudioPlayerProps> = ({
  src,
  type,
  downloadUrl,
  onDownloadClick,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => setIsPlaying(false);

  const handleSeekChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (key: Key) => {
    const newSpeed = parseFloat(key.toString());
    if (!isNaN(newSpeed)) {
      setPlaybackRate(newSpeed);
      if (audioRef.current) {
        audioRef.current.playbackRate = newSpeed;
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  return (
    <Box
      display="flex"
      alignItems="center"
      borderRadius="x4"
      p="x8"
      bg="neutral-100"
      border="none"
      style={{ gap: '8px', width: '100%', maxWidth: '400px' }}
    >
      <audio
        ref={audioRef}
        src={src}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      >
        {type && <source src={src} type={type} />}
        Your browser does not support the audio element.
      </audio>

      <Button square small onClick={handlePlayPause}>
        {isPlaying ? <Icon name="pause" size="x20" /> : <Icon name="play" size="x20" />}
      </Button>

      <Box fontScale="c1" width="80px" textAlign="center">
        {formatTime(currentTime)} / {formatTime(duration)}
      </Box>

      <Box flexGrow={1}>
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={handleSeekChange}
          style={{ width: '100%' }}
        />
      </Box>

      <Select
        options={[
          ['0.5', '0.5x'],
          ['0.75', '0.75x'],
          ['1', '1x'],
          ['1.25', '1.25x'],
          ['1.5', '1.5x'],
          ['2', '2x'],
        ]}
        value={playbackRate.toString()}
        onChange={handleSpeedChange}
        style={{ width: '70px' }}
      />

      {downloadUrl && (
        <Button square small is="a" href={downloadUrl} download onClick={onDownloadClick}>
          <Icon size="x20" name="download" />
        </Button>
      )}
    </Box>
  );
};

export default CustomAudioPlayer;
