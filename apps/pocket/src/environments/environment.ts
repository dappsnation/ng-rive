// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseUrl: 'http://localhost:4200',
  firebase: {
    apiKey: "AIzaSyBIMf_0PYvuDiP5DiU1_fGA0i8O3BwS6DM",
    authDomain: "rive-pocket.firebaseapp.com",
    projectId: "rive-pocket",
    storageBucket: "rive-pocket.appspot.com",
    messagingSenderId: "950838646870",
    appId: "1:950838646870:web:73f82ddd8ead92b2f6c3f7",
    measurementId: "G-FEE4L0BPP6"
  },
  useEmulator: false
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.


// Work around for https://github.com/firebase/firebase-js-sdk/issues/4110
import firebase from 'firebase/app';
import 'firebase/auth';

if (environment.useEmulator) {
  const app = firebase.initializeApp(environment.firebase, 'rive-pocket');
  (app.auth() as any).useEmulator('http://localhost:9099', {disableWarnings: true});
}