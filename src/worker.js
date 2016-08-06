import Queue from './queue'
import { manualPromise } from '../src/utils'


export default class Worker {
  static createClass(f) {
    return class FWorker extends this {
      processTask = f
    }
  }

  static create(f) {
    const worker = new this()
    worker.processTask = f
    return worker 
  }

  constructor(options = {}) {
    this.queue = options.queue || new Queue()
    this.working = false
  }

  async push(task) {
    const promise = manualPromise()
    await this.queue.put({ task, promise })

    return { task, promise }
  }

  async execute(task) {
    const { promise } = await this.push(task)
    return await promise
  }

  async processTask(task) {
    throw new TypeError(`${this.constructor.name} does not implement the \`async processTask(task)\` method`)
  }

  start() {
    if (! this.working) {
      this.working = true
      this._loop()
    }

    return this
  }

  stop() {
    this.working = false
    return this
  }

  async _loop() {
    while (this.working) {
      let { task, promise } = await this.queue.get()

      if (! this.working) {
        await this.queue.put({ task, promise }, { first: true })
        return
      }

      try {
        const result = await this.processTask(task)
        promise.resolve(result)

      } catch (error) {
        throwInMainLoop(error)
      }
    }
  }

}


function throwInMainLoop(error) {
  setImmediate(() => { throw error })
}
