/* ==========================================================================
   Firebase settings for student accounts & results
   --------------------------------------------------------------------------
   1. Create a Firebase project (see FIREBASE_SETUP.md).
   2. Project settings → Your apps → Web app → copy the "firebaseConfig"
      object and paste it below in place of null.
   This config is NOT a secret — data is protected by firestore.rules.
   While it is null, student login is hidden and the app works as before.
   ========================================================================== */
window.FIREBASE_CONFIG = null;
/* Example:
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
*/

/* Login IDs are turned into internal e-mail addresses for Firebase Auth.
   No e-mail is ever sent. Keep these values once accounts exist. */
window.WS_ID_DOMAIN = {
  student: 'student.nuonbonorng8888-beep.github.io',
  teacher: 'teacher.nuonbonorng8888-beep.github.io'
};
