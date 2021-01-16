import { CanvasRenderer, Rive, Artboard, File, LinearAnimationInstance } from "./types";

export class RivePlayer {
  private ctx: CanvasRenderingContext2D;
  private renderer: CanvasRenderer;
  private artboard: Artboard;

  private animations: Record<string, LinearAnimationInstance> = {};

  constructor(
    private rive: Rive,
    private file: File,
    private canvas: HTMLCanvasElement,
  ) {
    this.ctx = this.canvas.getContext('2d');
    this.renderer = new rive.CanvasRenderer(this.ctx);
    this.artboard = this.file.defaultArtboard();
  }


  getAnimation(name: string) {
    if (!this.animations[name]) {
      const anim = this.artboard.animation('Untitled 1');
      this.animations[name] = new this.rive.LinearAnimationInstance(anim);
    }
    return this.animations[name];
  }

  play(animation: string) {
    const anim = this.getAnimation(animation);
    // advance the artboard to render a frame
    this.artboard.advance(0);

    // track the last time a frame was rendered
    let lastTime: number;
    const draw = (time: number) => {
      // Get delta time in sec
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Move frame
      anim.advance(delta);
      anim.apply(this.artboard, 1.0);
      this.artboard.advance(delta);

      // Render frame on canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.save();
      this.renderer.align(this.rive.Fit.contain, this.rive.Alignment.center, {
        minX: 0,
        minY: 0,
        maxX: this.canvas.width,
        maxY: this.canvas.height
      }, this.artboard.bounds);
      this.artboard.draw(this.renderer);
      this.ctx.restore();

      // Move animation forward
      if (anim.time < 1) {
        requestAnimationFrame(draw);
      } else {
        console.log('STOP');
      }
    }
    requestAnimationFrame(draw);

  }
}