interface AnimationFile {
  name: string;
  animations: AnimationState[];
}
export interface AnimationState {
  name: string;
  playing: boolean;
  time?: number | null;
  speed: number;
  mix: number;
  mode?: 'loop' | 'ping-pong' | 'one-shot';
  duration?: { start: number, end: number };
}

function createAnimation(name: string) {
  return {
    name,
    playing: false,
    speed: 1,
    mix: 0.5,
  }
}

export const files: AnimationFile[] = [{
  name: 'files',
  animations: [
    createAnimation('idle'),
    createAnimation('rollover_in'),
    createAnimation('rollover_out')
  ]
}, {
  name: 'knight',
  animations: [
    createAnimation('idle'),
    createAnimation('day_night'),
    createAnimation('night_day')
  ]
}, {
  name: 'marty',
  animations: [
    createAnimation('Animation1'),
    createAnimation('Animation2'),
  ]
}, {
  name: 'truck',
  animations: [
    createAnimation('idle'),
    createAnimation('curves'),
  ]
}, {
  name: 'opensource',
  animations: [
    createAnimation('Untitled 1'),
  ]
}, {
  name: 'control',
  animations: [
    createAnimation('Untitled 1'),
  ]
}];