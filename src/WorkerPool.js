import Worker from './Worker'

export default class WorkerPool {
  constructor(workerClass, options = {}) {
    if (options)

    super(null, options)

    this.workers = []
    this.nextWorker = 0
    this.nWorkers = (options.workers != null) ? options.workers : 10

    for (let i = 0; i < this.nWorkers; i++) {
      this.workers.push()
    }
  }

  _assignTask(task) {

  }
}
