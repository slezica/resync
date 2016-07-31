
export function manualPromise(originalPromise = null) {
  let state = 'pending'
  let resolve, reject
  
  const promise = new Promise((pResolve, pReject) => {
    resolve = function(value) {
      promise.state = 'resolved'
      promise.value = value
      pResolve(value)
    }

    reject = function(error) {
      promise.state = 'rejected'
      promise.error = error
      pReject(error)
    }
  })

  promise.state = 'pending'
  promise.resolve = resolve
  promise.reject = reject

  if (originalPromise) {
    originalPromise.then(
      value => promise.resolve(value),
      error => promise.reject(error)
    )
  }

  return promise
}