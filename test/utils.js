
export function tickTock() {
  return new Promise(resolve => {
    setImmediate(() => setImmediate(resolve))
  })
}
