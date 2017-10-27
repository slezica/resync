
export function tickTock() {
  return new Promise(resolve => {
    setImmediate(() => setImmediate(resolve))
  })
}


export function range(n: number) {
  const numbers = []
  for (let i = 0; i < n; i++) numbers.push(i)
  return numbers
}
