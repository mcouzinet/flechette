/* Dart validation for the session trust boundary — kept in its own pure module
   so it can be unit-tested without pulling in Firebase.
   A dart is {miss:true} or {n:1..20|25, mult:1|2|3} (no triple-bull). */
export function isValidDart(dart) {
  if (!dart || typeof dart !== 'object') return false
  if (dart.miss === true) return true
  const nOk = Number.isInteger(dart.n) && ((dart.n >= 1 && dart.n <= 20) || dart.n === 25)
  const mOk = dart.mult === 1 || dart.mult === 2 || dart.mult === 3
  return nOk && mOk && !(dart.n === 25 && dart.mult === 3)
}
