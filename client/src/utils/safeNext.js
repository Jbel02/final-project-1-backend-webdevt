/** Only same-app paths, so ?next= can't bounce someone to another site. */
export function safeNext(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}
