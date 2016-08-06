import Worker from './worker'

class Pool extends Worker {
  constructor(options) {
    super(options)

    this.workers = []

    for (let i = 0; i < this.options.size; i++) {
      this.workers.push(new Worker())
    }
  }

  doExecute(task) {
    
  }
}