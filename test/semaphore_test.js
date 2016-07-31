import 'babel-polyfill'
import chai, { expect } from 'chai'

import Semaphore from '../src/semaphore'
import { manualPromise } from '../src/utils'


describe("Semaphore", function() {

  describe("constructor", function() {
    it("should have a default value of 0", function() {
      expect(new Semaphore().value).to.equal(0)
    })

    it("should accept a positive integer as initial value", function() {
      expect(new Semaphore(5).value).to.equal(5)

      expect(() => new Semaphore(null)).to.throw(TypeError)
      expect(() => new Semaphore('x')).to.throw(TypeError)
      expect(() => new Semaphore(3.5)).to.throw(TypeError)
      expect(() => new Semaphore(NaN)).to.throw(TypeError)
    })
  })

  describe(".down()", function() {
    it("should decrease value", function() {
      const sem = new Semaphore(2)
      sem.down()
      expect(sem.value).to.equal(1)

      sem.down()
      expect(sem.value).to.equal(0)
    })

    it("should not block if value > 0", function() {
      const sem = new Semaphore(1)
      sem.down()
      expect(sem.value).to.equal(0)
      expect(sem.waiters).to.be.empty
    })

    it("should block if value == 0", function() {
      const sem = new Semaphore(0)
      sem.down()
      expect(sem.value).to.equal(0)
      expect(sem.waiters.length).to.equal(1)
      expect(sem.waiters[0].promise.state).to.equal('pending')
    })
  })

  describe(".up()", function() {
    it("should increase value", function() {
      const sem = new Semaphore(0)

      sem.up()
      expect(sem.value).to.equal(1)

      sem.up()
      expect(sem.value).to.equal(2)
    })

    it("should unblock waiters", async function() {
      const sem = new Semaphore(0)
      const whenDown = sem.down()

      sem.up()
      
      expect(sem.value).to.equal(0)
      expect(sem.waiters).to.be.empty
      await whenDown
    })
  })
})