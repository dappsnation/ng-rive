interface AnimationFile {
  name: string;
  animations: AnimationState[];
}
interface AnimationState {
  name: string;
  playing: boolean;
  time: number;
  speed: number;
  mix: number;
  mode?: 'loop' | 'ping-pong' | 'one-shot';
}

function createAnimation(name: string) {
  return {
    name,
    playing: false,
    time: 0,
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
}];