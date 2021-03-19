<h1 align="center">Angular Rive</h1>

A repository for Angular built around the [rive canvas runtime](https://help.rive.app/runtimes/overview).

[![GitHub](https://img.shields.io/github/license/dappsnation/ng-rive)](https://github.com/dappsnation/ng-rive/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/ng-rive)](https://www.npmjs.com/package/ng-rive)
[![npm](https://img.shields.io/npm/dm/ng-rive)](https://www.npmjs.com/package/ng-rive)


## Demo
- 🎞️ [Rive Player](https://rive-animation-player.netlify.app/)
- 🎥 [Animation Recorder](https://rive-video-recorder.netlify.app/)
- ⛱️ [Playground](https://ng-rive-playground.netlify.app/)

## Get started
1. Install :
```
npm install ng-rive
```

2. Import `RiveModule`: 
```typescript
import { RiveModule } from 'ng-rive';

@NgModule({
  declarations: [MyComponent],
  imports: [
    CommonModule,
    RiveModule,
  ],
})
export class MyModule { }
```

3. Add your .riv file in your assets

```
|-- assets
|   |--rive
|      |-- knight.riv
```
If you want to change the path you can specify it with the `RIVE_FOLDER` provider: 
```typescript
import { RiveModule, RIVE_FOLDER } from 'ng-rive';
@NgModule({
  declarations: [MyComponent],
  imports: [
    CommonModule,
    RiveModule,
  ],
  providers: [{
    provide: RIVE_FOLDER,
    useValue: 'assets/animations',
  }]
})
export class MyModule { }
```

4. Use in template : 
```html
<canvas riv="knight" width="500" height="500">
  <riv-player name="idle" play></riv-player>
</canvas>
```

Let's take a quick look : 
```html
<canvas riv="knight" width="500" height="500">
```
This will load the file at the folder destination and attach it to the canvas.

```html
<riv-player name="idle" play></riv-player>
```
This will load the animation "idle" and play it. The default behaviour will apply (if the animation has been built in "loop" mode, the animation will loop).


5. Debug: 
If you see the error `Error: Can't resolve 'fs'`, add this in your `package.json`: 
```json
"browser": {
  "fs": false,
  "path": false
}
```

If you see the error `No provider for HttpClient!`, add this in your `app.module.ts`:
```
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    ...,
    HttpClientModule
  ],
  ...
})
export class AppModule {}
```

----

## Canvas
The `RiveCanvasDirective` loads a `.riv` animation file into it's canvas tag : 

#### Input
- `[riv]`: The `.riv` file or it's name if in the asset. Full path is managed by the `RIVE_FOLDER` token.
- `[artboard]`: The name of the artboard to used. If not specified, the default one is used.
- `[width]`: The width of the canvas in pixel.
- `[height]`: The height of the canvas in pixel.
- `[fit]`: How the animation should fit inside the canvas.
- `[alignment]`: Where the animation should be positioned inside the canvas.
- `[lazy]`: If provided, the file will only be loaded when canvas is visible in the viewport.
- `[viewbox]`: Enable zoom in the canvas. Expect a string `minX minY maxX maxY`. Default `0 0 100% 100%`.

⚠️ The `lazy` input use the `IntersectionObserver` API which will not work in all browser.

#### Output
- `(artboardChange)`: Emit the new Artboard


#### Examples
Canvas zoomed from "25% 25%" (top left), to "75% 75%" (bottom right).
```html
<canvas riv="knight" viewbox="25% 25% 75% 75%" width="500" height="500"></canvas>
```

----

## Player
You can use `riv-player` to manipulate the animation : 

#### Input / Output
- `[(time)]`: Bind the animation to a specific time
- `[(play)]`: Bind the player to a boolean (playing: `true`, paused: `false`).
- `[(speed)]`: The speed at which the animation should play. Negative values cause the animation to play backward.

⚠️ The speed only applies if `mode` is provided.

#### Input
- `[name]`: The name of the animation in the file loaded by the canvas.
- `[mode]`: Force a mode: `"one-shot"`, `"loop"` or `"ping-pong"` (if `undefined`, default mode is used).
- `[mix]`: The weight of this application over another in the same `Artboard`.
- `[autoreset]`: If `true`, will reset the animation to `start` when done (only for `one-shot` mode).

#### Output
- `(load)`: Emitted the loaded `LinearAnimation`.

### Player Mode or Default
Rive automatically apply the loop, ping-pong, speed and other property by default in the runtime.
Setting the `mode` property will override the default behavior.

Using `mode` might create conflict with default behavior. Known conflicts are:
- using a "loop" mode with an animation that is already a loop will fail if speed is negative

### Play if canvas is visible
To save ressources you can play the animation only when the canvas is visible in the viewport : 
```html
<canvas #canvas="rivCanvas" riv="knight" width="500" height="500">
  <riv-player name="idle" [name]="canvas.isVisible | async"></riv-player>
</canvas>
```

### Multiple Animations
You can run multiple animations within the same canvas : 
```html
<canvas riv="knight">
  <riv-player name="idle" play></riv-player>
  <riv-player name="day_night" play mode="ping-pong" speed="0.5"></riv-player>
</canvas>
```

----
## Node
The `RiveNode` directive give you access to one node :
```html
<canvas riv="knight">
  <riv-player name="idle" play></riv-player>
  <riv-node name="cloud" x="300"></riv-node>
</canvas>
```
This example will set the position of the cloud to 300px of its origin.

**Important**: You need to have at least one animation playing to modify a node.

#### Input
- `[x]` The x position of the node.
- `[y]` The y position of the node.
- `[scaleX]` The scaleX of the node.
- `[scaleY]` The scaleX of the node.
- `[scale]` Apply scaleX & scaleY.
- `[rotation]` Apply rotation on the node. If value is below 2*PI use radians, else degrees.

⚠️ If the property of the node is updated by the animation, the animation wins.

## Roadmap
- Create two directives, `riv-player` with `mode` and `riv-anim` without to avoid conflicts.