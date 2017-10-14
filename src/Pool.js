import ProxyPromise from 'proxy-promise'

import Queue from './Queue'


export default class Pool {

  constructor(size) {
    this.size = size
    this.queue = new Queue()
    this.isWorking = false
  }

  async execute(task) {
    this.start()
    const promise = new ProxyPromise()

    async function wrappedTask() {
      try {
        const value = await Promise.resolve(task())
        promise.resolve(value)
      } catch (error) {
        promise.reject(error)
      }
    }

    await this.queue.put(wrappedTask)

    return promise.then(value => value)
  }

  start() {
    if (! this.isWorking) {
      this.isWorking = true
      for (let i = 0; i < this.size; i++) this._runWorker()
    }
  }

  stop() {
    this.isWorking = false
  }

  async _runWorker() {
    while (true) {
      let nextTask = await this.queue.getIf(() => this.isWorking)
      if (! nextTask) return

      await nextTask()
    }
  }
}



