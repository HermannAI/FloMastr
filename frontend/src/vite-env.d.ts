/// <reference types="vite/client" />

// Explicitly exclude Firebase types since we don't use Firebase
// but some dependencies may pull in Firebase types as transitive dependencies
declare module 'firebase' {}
declare module 'firebase/*' {}
