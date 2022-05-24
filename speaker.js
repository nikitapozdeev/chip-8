class Speaker {
  constructor() {
    this._context = new (window.AudioContext || window.webkitAudioContext)

    this._oscillator = this._context.createOscillator();
    this._oscillator.connect(this._context.destination);
    this._isStarted = false;
  }

  play() {
    if (this._isStarted) {
      this._context.resume();
    } else {
      this._oscillator.frequency.setTargetAtTime(440, this._context.currentTime, 0);
      this._oscillator.start(0);
      this._isStarted = true;
    } 
  }

  stop() {
    this._context.suspend();
  }
}

export default Speaker