// This file explicitly excludes Firebase types since we don't use Firebase
// but some dependencies pull in Firebase types as transitive dependencies

declare module 'firebase' {
  // Intentionally empty to prevent TypeScript from looking for Firebase types
}

declare module 'firebase/*' {
  // Wildcard to catch all Firebase module imports
}
