import ProxyPromise from 'proxy-promise'

import Queue from './Queue'


export default class Pool {

  constructor(size) {
    this.size = size
    this.queue = new Queue()
    this.isWorking = false
  }

  async execute(func) {
    this.start()

    const task = {
      execute: func,
      promise: new ProxyPromise()
    }

    await this.queue.put(task)

    return task.promise.then(value => value)
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
      let task = await this.queue.getIf(() => this.isWorking)
      if (! task) return

      try {
        const value = await Promise.resolve(task.execute())
        task.promise.resolve(value)
      } catch (error) {
        task.promise.reject(error)
      }
    }
  }
}



