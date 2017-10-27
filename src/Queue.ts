import ProxyPromise from 'proxy-promise'

import Semaphore from './Semaphore'


export default class Queue<T> {

  protected _maxSize: number
  protected _items: Array<T>
  protected _sem: Semaphore

  constructor(maxSize = Infinity) {
    this._maxSize = maxSize
    this._items = []
    this._sem = new Semaphore(0, maxSize)
  }

  get size() {
    return this._items.length
  }

  get maxSize() {
    return this._maxSize
  }

  async put(item: T) {
    await this._sem.up()
    this._items.push(item)
  }

  async putFirst(item: T) {
    await this._sem.up()
    this._items.unshift(item)
  }

  async get() {
    await this._sem.down()
    return this._items.shift()
  }

  async getIf(predicate: () => boolean) {
    await this._sem.down()

    if (predicate()) {
      return this._items.shift()
    } else {
      return undefined
    }
  }

  async getLast() {
    await this._sem.down()
    return this._items.pop()
  }
}
