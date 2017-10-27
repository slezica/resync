import 'mocha'
import { expect } from 'chai'

import { tickTock, range } from './utils'

import Pool from '../src/Pool'


describe("Pool", function() {

  describe(".execute()", function() {
    it("should run a task asynchronously", async function() {
      const pool = new Pool(1)

      let executed = false
      const promise = pool.execute(() => executed = true)

      expect(executed).to.equal(false)
      await promise
      expect(executed).to.equal(true)
    })

    it("should return a Promise of the task result", async function() {
      expect(await new Pool(1).execute(() => 1234)).to.equal(1234)
    })

    it("should start tasks in order", async function() {
      const pool = new Pool(3)

      let idCounter = 0
      const executionOrder: Array<number> = []

      async function task(id: number) {
        executionOrder.push(id)
      }

      await Promise.all(
        range(10).map(i => pool.execute(() => task(i)))
      )

      expect(executionOrder).to.deep.equal(range(10))
    })

    it("should keep concurrency limited", async function() {
      const size = 3
      const pool = new Pool(3)

      let activeTasks = 0
      const activeTaskHistory: Array<number> = []

      async function task() {
        activeTaskHistory.push(++activeTasks)
        await tickTock()
        activeTaskHistory.push(--activeTasks)
      }

      await Promise.all(
        range(size * 2).map(i => pool.execute(task))
      )

      expect(Math.max.apply(null, activeTaskHistory)).to.equal(size)
    })
  })
})
