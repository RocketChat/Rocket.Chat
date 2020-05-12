import { callbacks } from '../../callbacks/server';
import { Spotify } from '../lib/spotify';

callbacks.add('beforeSaveMessage', Spotify.transform, callbacks.priority.LOW, 'spotify-save');
callbacks.add('renderMessage', Spotify.render, callbacks.priority.MEDIUM, 'spotify-render');
