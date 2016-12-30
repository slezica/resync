import ProxyPromise from 'proxy-promise'


export default class Semaphore {

  constructor(value = 0, maxValue = Infinity) {
    if (! isValidValue(value)) {
      throw new TypeError(`Semaphore value should be 0 or a positive integer, not ${value}`)
    }

    if (! isValidMaxValue(maxValue)) {
      throw new TypeError(`Semaphore maxValue should be 0, a positive integer or Infinity, not ${maxValue}`)
    }

    if (value > maxValue) {
      throw new TypeError(`Semaphore value (${value}) should not be greater than maxValue (${maxValue})`)
    }

    this.value = value
    this.maxValue = maxValue
    this.downWaiters = []
    this.upWaiters = []
  }

  async down() {
    if (this.value === 0) {
      // We need to wait for up() to be called
      const promise = new ProxyPromise()
      this.downWaiters.push({ promise })

      await promise

    } else if (this.upWaiters.length > 0) {
      // We should wake up a waiter instead of decreasing value
      this.upWaiters.shift().promise.resolve()

    } else {
      this.value--
    }
  }

  async up() {
    if (this.value === this.maxValue) {
      // We need to wait for down() to be called
      const promise = new ProxyPromise()
      this.upWaiters.push({ promise })

      await promise

    } else if (this.downWaiters.length > 0) {
      // We should wake up a waiter instead of increasing value
      this.downWaiters.shift().promise.resolve()

    } else {
      this.value++
    }
  }

}


function isValidValue(value) {
  return Number.isInteger(value) && value >= 0
}


function isValidMaxValue(maxValue) {
  return maxValue === Infinity || (Number.isInteger(maxValue) && maxValue >= 0)
}
