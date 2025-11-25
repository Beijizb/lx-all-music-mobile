declare module 'react-native-background-timer' {
  interface BackgroundTimer {
    setTimeout(callback: () => void, delay: number): number
    clearTimeout(id: number): void
    setInterval(callback: () => void, delay: number): number
    clearInterval(id: number): void
  }
  
  const BackgroundTimer: BackgroundTimer
  export default BackgroundTimer
}

