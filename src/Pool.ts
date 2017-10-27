import ProxyPromise from 'proxy-promise'

import Queue from './Queue'


export type Task = {
  execute: Function
  promise: ProxyPromise<any>
}


export default class Pool {

  size: number
  queue: Queue<Task>
  isWorking: boolean

  constructor(size: number) {
    this.size = size
    this.queue = new Queue()
    this.isWorking = false
  }

  async execute(func: Function) {
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



