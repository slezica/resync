import ProxyPromise from 'proxy-promise'

import Semaphore from './Semaphore'


export default class Queue<T> {

  maxSize: number
  items: Array<T>
  sem: Semaphore

  constructor(maxSize = Infinity) {
    this.maxSize = maxSize
    this.items = []
    this.sem = new Semaphore(0, maxSize)
  }

  get size() {
    return this.items.length
  }

  async put(item: T) {
    await this.sem.up()
    this.items.push(item)
  }

  async putFirst(item: T) {
    await this.sem.up()
    this.items.unshift(item)
  }

  async get() {
    await this.sem.down()
    return this.items.shift()
  }

  async getIf(predicate: () => boolean) {
    await this.sem.down()

    if (predicate()) {
      return this.items.shift()
    } else {
      return undefined
    }
  }

  async getLast() {
    await this.sem.down()
    return this.items.pop()
  }
}
