import { manualPromise } from './utils'


export default class Semaphore {

  constructor(value = 0) {
    if (! (Number.isInteger(value) && value >= 0)) {
      throw new TypeError(`Semaphore(value): value should be a positive integer, not ${value}`)
    }

    this.value = value
    this.waiters = []
  }

  async down() {
    if (this.value > 0) {
      this.value--
    } else {
      const promise = manualPromise()
      this.waiters.push({ promise }) // will be resolved by .up()

      await promise
    }
  }

  up() {
    if (this.waiters.length == 0) {
      this.value++
    } else {
      const { promise } = this.waiters.shift()
      promise.resolve()
    }
  }
}