import ProxyPromise from 'proxy-promise'

import Queue from './Queue'


export type Task = {
  execute: Function
  promise: ProxyPromise<any>
}


export default class Pool {

  protected _size: number
  protected _queue: Queue<Task>
  protected _isStarted: boolean

  constructor(size: number) {
    this._size = size
    this._queue = new Queue()
    this._isStarted = false
  }

  get size() {
    return this._size
  }

  get isStarted() {
    return this._isStarted
  }

  async execute(func: Function) {
    this.start()

    const task = {
      execute: func,
      promise: new ProxyPromise()
    }

    await this._queue.put(task)

    return task.promise.then(value => value)
  }

  start() {
    if (! this._isStarted) {
      this._isStarted = true
      for (let i = 0; i < this._size; i++) this._runWorker()
    }
  }

  stop() {
    this._isStarted = false
  }

  async _runWorker() {
    while (true) {
      let task = await this._queue.getIf(() => this._isStarted)
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



