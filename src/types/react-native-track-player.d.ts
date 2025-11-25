// Type declarations for react-native-track-player
// This is a temporary fix until the module is properly installed

declare module 'react-native-track-player' {
  export enum State {
    None = 'none',
    Ready = 'ready',
    Playing = 'playing',
    Paused = 'paused',
    Stopped = 'stopped',
    Buffering = 'buffering',
    Loading = 'loading',
    Connecting = 'connecting',
  }

  export enum Event {
    PlaybackState = 'playback-state',
    PlaybackError = 'playback-error',
    PlaybackTrackChanged = 'playback-track-changed',
    RemotePlay = 'remote-play',
    RemotePause = 'remote-pause',
    RemoteStop = 'remote-stop',
    RemoteNext = 'remote-next',
    RemotePrevious = 'remote-previous',
    RemoteSeek = 'remote-seek',
  }

  export interface Track {
    id: string
    url: string
    title?: string
    artist?: string
    album?: string
    artwork?: string
    duration?: number
    headers?: Record<string, string>
    userAgent?: string
    [key: string]: any
  }

  export enum Capability {
    Play = 'play',
    Pause = 'pause',
    Stop = 'stop',
    Next = 'next',
    Previous = 'previous',
    SeekTo = 'seekTo',
    SkipToNext = 'skipToNext',
    SkipToPrevious = 'skipToPrevious',
  }

  export enum RepeatMode {
    Off = 'off',
    Track = 'track',
    Queue = 'queue',
  }

  const TrackPlayer: {
    setupPlayer(options?: any): Promise<void>
    add(tracks: Track[]): Promise<void>
    remove(tracks: string[]): Promise<void>
    updateMetadataForTrack(trackId: string, metadata: Partial<Track>): Promise<void>
    play(): Promise<void>
    pause(): Promise<void>
    stop(): Promise<void>
    seekTo(position: number): Promise<void>
    setVolume(volume: number): Promise<void>
    setRate(rate: number): Promise<void>
    getVolume(): Promise<number>
    getRate(): Promise<number>
    getPosition(): Promise<number>
    getDuration(): Promise<number>
    getState(): Promise<State>
    getTrack(trackId: string): Promise<Track | null>
    getQueue(): Promise<Track[]>
    getActiveTrack(): Promise<Track | null>
    getActiveTrackIndex(): Promise<number>
    skip(trackId: string): Promise<void>
    skipToNext(): Promise<void>
    skipToPrevious(): Promise<void>
    setRepeatMode(mode: RepeatMode): Promise<void>
    getRepeatMode(): Promise<RepeatMode>
    updateOptions(options: any): Promise<void>
    updateNowPlayingTitles(duration: number, title: string, artist: string, album: string): Promise<void>
    destroy(): Promise<void>
    isCached(url: string): Promise<boolean>
    getCacheSize(): Promise<number>
    clearCache(): Promise<void>
    registerPlaybackService(serviceFactory: () => (() => Promise<void>) | Promise<() => void>): void
    addEventListener(event: Event, handler: (data: any) => void): { remove: () => void }
    removeEventListener(event: Event, handler: (data: any) => void): void
  }

  export default TrackPlayer
  export { State, Event, RepeatMode, Capability }
}

