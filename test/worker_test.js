import 'babel-polyfill'
import chai, { expect, assert } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
chai.use(sinonChai)

import Queue from '../src/queue'
import Worker from '../src/worker'


class TestWorker extends Worker {
  constructor(options) {
    super(options)

    for (let method of [ 'push', 'processTask', '_loop' ]) {
      this[method] = sinon.spy(this[method])
    }
  }

  processTask(task) {
    return task.n + 1
  }
}


describe("Worker", function() {

  describe("constructor", function() {
    it("should accept an optional queue", function() {
      expect(new TestWorker().queue).instanceOf(Queue)

      const queue = new Queue()
      expect(new TestWorker({ queue }).queue).to.equal(queue)
    })
  })

  describe("static .create()", function() {
    it("should create a worker that runs a function", async function() {
      const f = () => 123
      const worker = Worker.create(f).start()
      
      expect(await worker.execute()).to.equal(123)
    })

    it("should create instances of own class", function() {
      class SubWorker extends Worker {}
      const worker = SubWorker.create(() => 1)

      expect(worker).instanceOf(SubWorker)
    })
  })

  describe("static .createClass()", function() {
    it("should create a Worker class that runs a function", async function() {
      const f = () => 123
      const WorkerClass = Worker.createClass(f)
      const worker = new WorkerClass().start()

      expect(await worker.execute()).to.equal(123)
    })

    it("should create subclasses of own class", function() {
      class SubWorker extends Worker {}
      const WorkerClass = SubWorker.createClass(() => 1)

      expect(Object.getPrototypeOf(WorkerClass)).to.equal(SubWorker)
    })
  })

  describe(".push()", function() {
    it("should put items in the internal queue", async function() {
      const worker = new TestWorker()
      await worker.push({})

      expect(worker.queue.size).to.equal(1)
    })

    it("should return a { task, promise } object", async function() {
      const someTask = { n: 1 }
      const worker = new TestWorker()

      const { task, promise } = await worker.push(someTask)

      expect(task).to.equal(someTask)
      expect(promise).to.equal(worker.queue.items[0].promise)
    })

    it("should eventually invoke `processTask()`", async function() {
      const worker = new TestWorker().start()
      await worker.push({})
      
      await eventually(() => expect(worker.processTask).calledOnce)
    })

    it("should resolve the promise to the result of `processTask()`", async function() {
      const worker = new TestWorker().start()
      const { promise } = await worker.push({ n: 5 })
  
      expect(await promise).to.equal(6)
    })

  })

  describe(".execute()", function() {
    it("should immediately invoke `push()`", function() {
      const someTask = { n: 1 }
      const worker = new TestWorker().start()

      worker.execute(someTask)
      expect(worker.push).calledWith(someTask)
    })

    it("should return a promise for the result of `processTask()`", async function() {
      const worker = new TestWorker().start()
      const result = await worker.execute({ n: 5 })

      expect(result).to.equal(6)
    })
  })

  describe(".start()", function() {
    it("should immediately invoke `_loop()`", function() {
      const worker = new TestWorker().start()
      expect(worker._loop).calledOnce
    })

    it("should only invoke `_loop()` once", function() {
      const worker = new TestWorker()
      worker.start()
      worker.start()
      expect(worker._loop).calledOnce
    })

    it("should hold calls to `processTask()`", async function() {
      const worker = new TestWorker()
      worker.execute(1)
      
      expect(worker.processTask).not.called
      worker.start()
      await eventually(() => expect(worker.processTask).calledOnce)
    })
  })

  describe(".stop()", function() {
    it("should prevent calls to `processTask()`", async function() {
      const worker = new TestWorker().start().stop()
      worker.execute(1)
      await eventually(() => expect(worker.processTask.callCount).to.equal(0))
    })

    it("should immediately stop calls to `processTask()`", async function() {
      const worker = new TestWorker().start()

      worker.execute(1)
      worker.stop()

      await eventually(() => expect(worker.processTask.callCount).to.equal(0))
    })

    it("should return last task to the queue if invoked just in time", async function() {
      const worker = new TestWorker()
      
      // This is the case we're testing:
      // - The worker gets a task from the front of the queue, plans to execute it
      // - `stop()` is asynchronously called
      // - The task must be returned to the front of the queue

      const originalQueueGet = worker.queue.get

      worker.queue.get = async () => {
        const item = await originalQueueGet.call(worker.queue)
        worker.stop()
        return item
      }

      worker.start()
      await worker.push(123)

      await eventually(() => expect(worker.queue.items[0].task).to.equal(123))
    })
  })
})


function eventually(f) {
  // process.nextTick() will wait until all pending events have been processed
  return new Promise(resolve =>
    process.nextTick(() => { f(); resolve() })
  )
}

