<h1 align="center">Angular Rive</h1>

A repository for Angular built around the [rive canvas runtime](https://help.rive.app/runtimes/overview).

[![GitHub](https://img.shields.io/github/license/dappsnation/ng-rive)](https://github.com/dappsnation/ng-rive/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/ng-rive)](https://www.npmjs.com/package/ng-rive)
[![npm](https://img.shields.io/npm/dm/ng-rive)](https://www.npmjs.com/package/ng-rive)


## Compatibility
Animations built before version 0.7.0 rive-canvas will not work with new versions of ng-rive.

| Angular | Rive-canvas  | ng-rive |
| --------|--------------|---------|
| >=15    | 0.7.*        | 0.2.7   |
| 14-15   | 0.7.*        | 0.2.*   |
| 12-13   | 0.7.*        | 0.1.*   |
| <12     | 0.6.*        | 0.0.*   |

Note: Version 0.2.7 and above use standalone component.

# Get started
1. Install :
```
npm install ng-rive @rive-app/canvas-advanced
```

2. Module vs standalone `RiveModule`: 

  1. Module `RiveModule`
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

  2. Standalone:
```typescript
import { RiveCanvas, RiveLinearAnimation } from 'ng-rive';
@Component({
  ...
  standalone: true,
  imports: [
    RiveCanvas,
    RiveLinearAnimation,
    ...
  ],
})
export class MyComponent {}
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
  <riv-animation name="idle" play></riv-animation>
</canvas>
```

5. Debug: 
If you see the error `Error: Can't resolve 'fs'`, add this in your `package.json`: 
```json
"browser": {
  "fs": false,
  "path": false
}
```

6. (Bonus) Rive wasm runtime custom location: 

If you want to host the rive wasm (WebAssembly runtime environment) yourself or use a cdn other than unpkg, you can do so with the `RIVE_WASM` provider:
```typescript
import { RiveModule, RIVE_WASM } from 'ng-rive';
@NgModule({
  declarations: [MyComponent],
  imports: [
    CommonModule,
    RiveModule,
  ],
  providers: [{
    provide: RIVE_WASM,
    useValue: 'assets/rive/rive.wasm',
  }]
})
export class MyModule { }
```

to build the rive wasm runtime with the angular project it must be added into your `angular.json` config file. the `rive.wasm` runtime is provided with the `@rive-app/canvas-advanced` package. This package is already part of `@ng-rive`. This can be configured as follows:

```json
...
  "architect": {
    "build": {
      ...
      "options": {
        ...
        "assets": {
          ...,
          {
            "glob": "*.wasm",
            "input": "node_modules/@rive-app/canvas-advanced/",
            "output": "assets/rive/"
          },
          ...
        },
        ...
      },
      ...
    },
    ...
  },
...
```

7. (Bonus) Rive version
If you want to set a specific version for your wasm file you can use the `RIVE_VERSION` injection token.
```typescript
  providers: [{
    provide: RIVE_VERSION,
    useValue: 'latest',
  }]
```
`ng-rive` used to default to "latest", but it created some issue in production app.
Now it defaults to the latest version used when the library is publish.
You can see the current default version [here](https://github.com/dappsnation/ng-rive/blob/master/libs/ng-rive/src/lib/service.ts#L23).

# API

## Canvas
The `RiveCanvas` loads a `.riv` animation file into it's canvas tag : 

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
## Animation
Run an animation inside a canvas based on `name` or `index`:
```html
<canvas riv="knight" width="500" height="500">
  <riv-animation name="idle" play speed="0.5"></riv-animation>
</canvas>
```

#### Input
- `[name]`: The name of the animation in the file loaded by the canvas.
- `[index]` The index of the animation in the file loaded by the canvas (used if name is not provided).
- `[play]`: Bind the player to a boolean (playing: `true`, paused: `false`).
- `[speed]`: The speed at which the animation should play. Negative values cause the animation to play backward.
- `[mix]`: The weight of this application over another in the same `Artboard`.

#### Output
- `(load)`: Emitted the loaded `LinearAnimation`.


----
## Player
Provide more control over the animation
```html
<canvas riv="poison-loader" width="500" height="500">
  <riv-player #player="rivPlayer" name="idle" [time]="time" mode="one-shot"></riv-player>
</canvas>
<input type="range" step="0.1" (input)="time = $event.target.value" [min]="player.startTime" [max]="player.endTime" />
```

#### Input / Output
- `[(time)]`: Bind the animation to a specific time
- `[(play)]`: Bind the player to a boolean (playing: `true`, paused: `false`).
- `[(speed)]`: The speed at which the animation should play. Negative values cause the animation to play backward.

Based on the mode, the play, time & speed might change automatically.

#### Input
- `[name]`: The name of the animation in the file loaded by the canvas.
- `[index]` The index of the animation in the file loaded by the canvas (used if name is not provided).
- `[mix]`: The weight of this application over another in the same `Artboard`.

⚠️ **Deprecated**: These input will be remove in the next version
- [mode]: Force a mode: "one-shot", "loop" or "ping-pong" (if undefined, default mode is used).
- [autoreset]: If true, will reset the animation to start when done (only for one-shot mode).

#### Output
- `(load)`: Emitted the loaded `LinearAnimation`.
- `(timeChange)`: Emitted just before refreshing the canvas when `play` is true. This output will be triggered for every frame if listened to. As every output create a rendering cycle, use it with care.

----
## Node
The `RiveNode` directive give you access to one node :
```html
<canvas riv="knight">
  <riv-animation name="idle" play></riv-animation>
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


----
## State Machine
You can manipulate the state of a state machine animation though inputs: 
```html
<canvas riv="skills">
  <riv-state-machine name="move" play>
    <riv-input name="Level" [value]="level.value"><riv-input>
  </riv-state-machine>
</canvas>
<input type="radio" formControl="level" value="0" > Beginner
<input type="radio" formControl="level" value="1"> Intermediate
<input type="radio" formControl="level" value="2"> Expert
```

### Input
- `[name]` The name of the state machine in the file loaded by the canvas.
- `[index]` The index of the state machine in the file loaded by the canvas (used if name is not provided).
- `[play]`: Bind the player to a boolean (playing: `true`, paused: `false`).
- `[speed]`: The speed at which the animation should play. Negative values cause the animation to play backward.

#### Output
- `(load)`: Emitted the loaded `StateMachine`.
- `(stateChange)`: Emitted the names of the states that have changed.

## State Machine Input
The `riv-input` enables you to manipulated the state machine: 
```html
<canvas riv="skills">
  <riv-state-machine name="move" play>
    <riv-input #trigger="rivInput" name="Level"><riv-input>
  </riv-state-machine>
</canvas>
<button (click)="tigger.fire()">Trigger change</button>
```

### Input
- `[name]` The name of the input
- `[value]` The value of the input, only if the type of the input is `Boolean` or `Number`

### Ouput
- `(load)` Emit the State Machine Input object when it's loaded from the rive file.
- `(change)` Emit when the input value is changed or if fired.

### Method
- `fire()` Trigger a change, only if the type of the input is `Trigger`

# Technics

### Play if canvas is visible
To save ressources you can play the animation only when the canvas is visible in the viewport : 
```html
<canvas #canvas="rivCanvas" riv="knight" width="500" height="500">
  <riv-animation name="idle" [name]="canvas.isVisible | async"></riv-animation>
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