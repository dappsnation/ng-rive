/// <reference lib="webworker" />

import RiveBuilder, { File, RiveCanvas as Rive } from '@rive-app/canvas-advanced';


interface RiveMessage {
  canvas: OffscreenCanvas;
  url: string;
  version?: string;
  animations: string[];
}

let rive: Rive;
async function getRive(version = 'latest') {
  if (!rive) {
    rive = await RiveBuilder({ locateFile: () => `https://unpkg.com/@rive-app/canvas-advanced@${version}/rive.wasm` });
  }
  return rive;
}

async function loadFile(url: string) {
  const req = new Request(url);
  const res = await fetch(req);
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}

const files: Record<string, File> = {};
async function getFile(url: string, version = 'latest') {
  if (!files[url]) {
    const [ rive, blob ] = await Promise.all([ getRive(version), loadFile(url) ]);
    files[url] = await rive.load(blob);
  }
  return files[url];
}

addEventListener('message', async ({ data }: { data: RiveMessage }) => {
  const { canvas, url, version, animations } = data;
  const file = await getFile(url, version);
  const artboard = file.defaultArtboard();

  // Associate CanvasRenderer with offset context
  // const ctx = canvas.getContext('2d');
  // if (!ctx) throw new Error('Cannot find context of offscreen canvas');

  const renderer = rive.makeRenderer(canvas, true);

  // Move frame of each animation
  const animate = animations.map((name: string) => {
    const animation = artboard.animationByName(name);
    const instance = new rive.LinearAnimationInstance(animation, artboard);
    return (delta: number) => {
      instance.advance(delta);
      instance.apply(1.0);
    }
  });

  // Draw of the canvas
  let lastTime = 0;
  const draw = (time: number) => {
    if (!lastTime) lastTime = time;
    const elapsedTimeMs = time - lastTime;
    const delta = elapsedTimeMs / 1000;
    lastTime = time;
    
    renderer.clear();

    animate.forEach(cb => cb(delta))
    artboard.advance(delta);

    renderer.save();
    renderer.align(rive.Fit.contain, rive.Alignment.center, {
        minX: 0,
        minY: 0,
        maxX: canvas.width,
        maxY: canvas.height
    }, artboard.bounds);
    artboard.draw(renderer);
    renderer.restore();
    // renderer.flush();
    rive.requestAnimationFrame(draw);
  }

  // Animation Frame run in the WebWorker
  rive.requestAnimationFrame(draw);
});
