import ProxyPromise from 'proxy-promise'


export type Waiter = {
  promise: ProxyPromise<void>
}


export default class Semaphore {

  protected _value: number
  protected _maxValue: number
  protected _downWaiters: Array<Waiter>
  protected _upWaiters: Array<Waiter>

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

    this._value = value
    this._maxValue = maxValue
    this._downWaiters = []
    this._upWaiters = []
  }

  get value() {
    return this._value
  }

  get maxValue() {
    return this._maxValue
  }

  async down() {
    if (this._value === 0) {
      // We need to wait for up() to be called
      const promise = new ProxyPromise<void>()
      this._downWaiters.push({ promise })

      await promise

    } else if (this._upWaiters.length > 0) {
      // We should wake up a waiter instead of decreasing value
      this._upWaiters.shift().promise.resolve()

    } else {
      this._value--
    }
  }

  async up() {
    if (this._value === this._maxValue) {
      // We need to wait for down() to be called
      const promise = new ProxyPromise<void>()
      this._upWaiters.push({ promise })

      await promise

    } else if (this._downWaiters.length > 0) {
      // We should wake up a waiter instead of increasing value
      this._downWaiters.shift().promise.resolve()

    } else {
      this._value++
    }
  }

}


function isValidValue(value: number) {
  return Number.isInteger(value) && value >= 0
}


function isValidMaxValue(maxValue: number) {
  return maxValue === Infinity || (Number.isInteger(maxValue) && maxValue >= 0)
}
