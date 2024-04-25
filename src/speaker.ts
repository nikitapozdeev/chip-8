class Speaker {
  private readonly context: AudioContext;
  private readonly oscillator: OscillatorNode;
  private isStarted: boolean;

  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.oscillator = this.context.createOscillator();
    this.oscillator.connect(this.context.destination);
    this.isStarted = false;
  }

  play() {
    if (this.isStarted) {
      this.context.resume();
    } else {
      this.oscillator.frequency.setTargetAtTime(440, this.context.currentTime, 0);
      this.oscillator.start(0);
      this.isStarted = true;
    }
  }

  stop() {
    this.context.suspend();
  }
}

export default Speaker;
