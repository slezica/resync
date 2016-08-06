import Queue from './queue'
import { manualPromise } from '../src/utils'


export default class Worker {

  constructor(options = {}) {
    if (this.constructor === Worker) {
      throw new Error("Worker is an abstract class. Subclass it and implement the `async processTask(task)` method")
    }

    this.queue   = options.queue || new Queue()
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
