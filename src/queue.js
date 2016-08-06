import { manualPromise } from './utils'


// TODO investigate if this can be implemented with Semaphore (consider case
// of queue with maxSize 0 and always having an empty `.items`)

export default class Queue {

  constructor(maxSize = Infinity) {
    if (! isValidMaxSize(maxSize)) {
      throw new TypeError(`Queue maxSize should be Infinity, a positive integer or 0, not ${maxSize}`)
    }
  
    this.maxSize = maxSize
    this.items   = []
    this.readers = []
    this.writers = []
  }

  get size() {
    return this.items.length
  }

  async put(item, { first = false } = {}) {
    if (this.readers.length > 0) {
      this.readers.shift().promise.resolve(item)

    } else if (this.size < this.maxSize) {
      first ? this.items.unshift(item) : this.items.push(item)

    } else {
      const promise = manualPromise()
      this.writers.push({ promise })
      
      await promise
      return this.put(item)
    }
  }

  async get() {
    if (this.size > 0) {
      const item = this.items.shift()

      if (this.writers.length > 0) {
        this.writers.shift().promise.resolve()
      }

      return item

    } else {
      const promise = manualPromise()
      this.readers.push({ promise })
      
      return await promise
    }
  }
}


function isValidMaxSize(maxSize) {
  return maxSize === Infinity || (Number.isInteger(maxSize) && maxSize >= 0)
}
