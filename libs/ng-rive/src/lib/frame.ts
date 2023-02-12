import { RiveCanvas } from "@rive-app/canvas-advanced";
import { Observable, switchMap } from "rxjs";

export const nextFrame = (rive: RiveCanvas): Promise<number> => {
  return new Promise((res) => {
    rive.requestAnimationFrame(res);
  })
}

// Observable that trigger on every frame
export const animationFrame = (rive: RiveCanvas) => new Observable<number>((subscriber) => {
  let start = 0;
  let first = true;
  const run = (time: number) => {
    const delta = time - start;
    start = time;
    if (first) {
      subscriber.next(16);  
      first = false;
    } else {
      subscriber.next(delta); 
    }
    // Because of bug in Chrome first value might be too big and cause issues
    if (subscriber.closed) return;
    rive.requestAnimationFrame(run)
  }
  rive.requestAnimationFrame(run);
});