import { Artboard, LinearAnimation, StateMachine } from "@rive-app/canvas-advanced";

export function toInt(value: number | string | undefined | null) {
  const v = typeof value === 'string' ? parseInt(value) : value;
  if (typeof v !== 'number') return;
  return v;
}

export function toFloat(value: number | string | undefined | null) {
  const v = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof v !== 'number') return;
  return v;
}

export function toBool(value: '' | boolean | null | undefined) {
  if (value === '' || value === true) return true;
  if (value === false) return false;
  return;
}

export function getAnimations(artboard?: Artboard) {
  const animations: LinearAnimation[] = [];
  if (!artboard) return [];
  const max = artboard.animationCount();
  for (let i = 0; i < max; i++) {
    animations.push(artboard.animationByIndex(i));
  }
  return animations;
}

export function getStateMachines(artboard?: Artboard) {
  const stateMachines: StateMachine[] = [];
  if (!artboard) return [];
  const max = artboard.stateMachineCount();
  for (let i = 0; i < max; i++) {
    stateMachines.push(artboard.stateMachineByIndex(i));
  }
  return stateMachines;
}


interface ClientCoordinates {
  clientX: number;
  clientY: number;
}

export function getClientCoordinates(event: MouseEvent | TouchEvent): ClientCoordinates {
  if (
    ["touchstart", "touchmove"].indexOf(event.type) > -1 &&
    (event as TouchEvent).touches?.length
  ) {
    event.preventDefault();
    return {
      clientX: (event as TouchEvent).touches[0].clientX,
      clientY: (event as TouchEvent).touches[0].clientY,
    };
  } else if (
    event.type === "touchend" &&
    (event as TouchEvent).changedTouches?.length
  ) {
    return {
      clientX: (event as TouchEvent).changedTouches[0].clientX,
      clientY: (event as TouchEvent).changedTouches[0].clientY,
    };
  } else {
    return {
      clientX: (event as MouseEvent).clientX,
      clientY: (event as MouseEvent).clientY,
    };
  }
};