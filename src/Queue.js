import ProxyPromise from 'proxy-promise'

import Semaphore from './Semaphore'


export default class Queue {

  constructor(maxSize = Infinity) {
    this.items = []
    this.maxSize = maxSize
    this.sem = new Semaphore(0, maxSize)
  }

  get size() {
    return this.items.length
  }

  async put(item) {
    await this.sem.up()
    this.items.push(item)
  }

  async putFirst(item) {
    await this.sem.up()
    this.items.unshift(item)
  }

  async get() {
    await this.sem.down()
    return this.items.shift()
  }

  async getLast() {
    await this.sem.down()
    return this.items.pop()
  }
}
