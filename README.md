# ng-rive

## Get started
1. Install :
```
npm install ng-rive rive-canvas
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

## Player
You can use `riv-player` to manipulate the animation : 
#### Input / Output
- `[(time)]`: Bind the animation to a specific time
- `[(play)]`: Bind the player to a boolean (playing: `true`, paused: `false`).
- `[(reverse)]`: Bind the player direction to a boolean

#### Input
- `[name]`: The name of the animation in the file loaded by the canvas.
- `[mode]`: Force a mode: `"one-shot"`, `"loop"` or `"ping-pong"` (if `undefined`, default mode is used).
- `[mix]`: The weight of this application over another in the same `Artboard`.
- `[speed]`: A multiplicator for the speed of the animation (default to 1).
- `[start]`: Starting time (in sec) of the animation in the editor (default to 0).
- `[end]`: Ending time (in sec) of the animation in the editor.
- `[autoreset]`: If `true`, will reset the animation to `start` when done (only for `one-shot` mode).

## Multiple Animations
You can run multiple animations within the same canvas : 
```html
<canvas riv="knight">
  <riv-player name="idle" play></riv-player>
  <riv-player name="day_night" play mode="ping-pong" speed="0.5"></riv-player>
</canvas>
```

## Known issues
Some animations defaulted to "loop" might encounter jumps when using with `start`.