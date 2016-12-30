import Worker from './Worker'


export default class WorkerPool extends Worker {

  static createClass(classOrFunc) {
    return class FWorkerPool extends this {
      createWorker = toWorkerFactory(classOrFunc)
    }
  }

  static create(classOrFunc, options = {}) {
    const pool = new this(options)
    pool.createWorker = toWorkerFactory(classOrFunc)
    return pool
  }

  constructor(options = {}) {
    super(options)
    this.workers = []

    const targetSize = (options.size != null) ? options.size : 10

    for (let i = 0; i < targetSize; i++) {
      this.workers.push(this.createWorker(options.options))
    }

    this.scheduler = new RoundRobinScheduler(this)
  }

  get size() {
    return this.workers.length
  }

  async processTask(task) {
    return await this.scheduler.getNextWorker().execute(task)
  }

  createWorker(options) {
    throw new TypeError(`${this.constructor.name} does not implement the \`createWorker(options)\` method`)
  }
}


class RoundRobinScheduler {
  constructor(pool) {
    this.pool = pool
    this.nextIndex = 0
  }

  getNextWorker() {
    const nextWorker = this.pool.workers[this.nextIndex]
    this.nextIndex = (this.nextIndex + 1) % this.pool.size

    return nextWorker
  }
}


function toWorkerFactory(func) {
  let WorkerClass

  if (func.prototype instanceof Worker) {
    WorkerClass = func

  } else {
    WorkerClass = Worker.createClass(func)
  }

  return function(options) { return new WorkerClass(options) }
}
