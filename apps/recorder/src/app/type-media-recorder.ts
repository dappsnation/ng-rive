// Type definitions for non-npm package w3c MediaStream Recording 1.0
// Project: https://w3c.github.io/mediacapture-record
// Definitions by: Elias Meire <https://github.com/elsmr>
//                 AppLover69 <https://github.com/AppLover69>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

interface MediaRecorderErrorEventInit extends EventInit {
  error: DOMException;
}

declare class MediaRecorderErrorEvent extends Event {
  constructor(type: string, eventInitDict: MediaRecorderErrorEventInit);
  readonly error: DOMException;
}

interface BlobEventInit extends EventInit {
  data: Blob;
  timecode?: number;
}

declare class BlobEvent extends Event {
  constructor(type: string, eventInitDict: BlobEventInit);
  readonly data: Blob;
  readonly timecode: number;
}

type BitrateMode = 'vbr' | 'cbr';

interface MediaRecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;
  audioBitrateMode?: BitrateMode;
}

type RecordingState = 'inactive' | 'recording' | 'paused';

interface MediaRecorderEventMap {
  "dataavailable": BlobEvent;
  "error": MediaRecorderErrorEvent;
  "pause": Event;
  "resume": Event;
  "start": Event;
  "stop": Event;
}

export declare class MediaRecorder extends EventTarget {
  readonly stream: MediaStream;
  readonly mimeType: string;
  readonly state: RecordingState;
  readonly videoBitsPerSecond: number;
  readonly audioBitsPerSecond: number;
  readonly audioBitrateMode: BitrateMode;

  ondataavailable: ((event: BlobEvent) => void) | null;
  onerror: ((event: MediaRecorderErrorEvent) => void) | null;
  onpause: EventListener | null;
  onresume: EventListener | null;
  onstart: EventListener | null;
  onstop: EventListener | null;

  constructor(stream: MediaStream, options?: MediaRecorderOptions);

  addEventListener<K extends keyof MediaRecorderEventMap>(type: K, listener: (this: MediaRecorder, ev: MediaRecorderEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof MediaRecorderEventMap>(type: K, listener: (this: MediaRecorder, ev: MediaRecorderEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;

  start(timeslice?: number): void;
  stop(): void;
  resume(): void;
  pause(): void;
  requestData(): void;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  static isTypeSupported(type: string): boolean;
}

interface Window {
  MediaRecorder: typeof MediaRecorder;
  BlobEvent: typeof BlobEvent;
  MediaRecorderErrorEvent: typeof MediaRecorderErrorEvent;
}