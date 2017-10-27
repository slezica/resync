import 'mocha'
import { expect } from 'chai'

import Semaphore from '../src/Semaphore'


describe("Semaphore", function() {

  describe("constructor", function() {
    it("should have a default value of 0", function() {
      expect(new Semaphore().value).to.equal(0)
    })

    it("should only accept 0 or a positive integer as value", function() {
      expect(new Semaphore(0).value).to.equal(0)
      expect(new Semaphore(5).value).to.equal(5)

      expect(() => new Semaphore(null)).to.throw(TypeError)
      expect(() => new Semaphore(3.5)).to.throw(TypeError)
      expect(() => new Semaphore(NaN)).to.throw(TypeError)
    })

    it("should have a default maxValue of Infinity", function() {
      expect(new Semaphore().maxValue).to.equal(Infinity)
    })

    it("should only accept 0, a positive integer or Infinity as maxValue", function() {
      expect(new Semaphore(0, 0).maxValue).to.equal(0)
      expect(new Semaphore(0, 5).maxValue).to.equal(5)
      expect(new Semaphore(0, Infinity).maxValue).to.equal(Infinity)

      expect(() => new Semaphore(0, null)).to.throw(TypeError)
      expect(() => new Semaphore(0, 3.5)).to.throw(TypeError)
      expect(() => new Semaphore(0, NaN)).to.throw(TypeError)
    })

    it("should only accept value <= maxValue", function() {
      new Semaphore(0, 0)
      expect(() => new Semaphore(1, 0)).to.throw(TypeError)
    })
  })

  describe(".down()", function() {
    it("should decrease value", async function() {
      const sem = new Semaphore(2)
      await sem.down()
      expect(sem.value).to.equal(1)

      await sem.down()
      expect(sem.value).to.equal(0)
    })

    it("should not block if value > 0", function() {
      const sem = new Semaphore(1)
      sem.down()
      expect(sem.value).to.equal(0)
      expect(sem.downWaiters).to.be.empty
    })

    it("should block if value == 0", function() {
      const sem = new Semaphore(0)
      sem.down()
      expect(sem.value).to.equal(0)
      expect(sem.downWaiters.length).to.equal(1)
      expect(sem.downWaiters[0].promise.state).to.equal('pending')
    })

    it("should unblock .up() waiters", function() {
      const sem = new Semaphore(1, 1)
      sem.up()
    })
  })

  describe(".up()", function() {
    it("should increase value", async function() {
      const sem = new Semaphore(0)

      await sem.up()
      expect(sem.value).to.equal(1)

      await sem.up()
      expect(sem.value).to.equal(2)
    })

    it("should not block if value < maxValue", function() {
      const sem = new Semaphore(0, 1)
      sem.up()

      expect(sem.value).to.equal(1)
      expect(sem.upWaiters).to.be.empty
    })

    it("should block if value == maxValue", function() {
      const sem = new Semaphore(0, 0)
      sem.up()

      expect(sem.value).to.equal(0)
      expect(sem.upWaiters.length).to.equal(1)
      expect(sem.upWaiters[0].promise.state).to.equal('pending')
    })

    it("should unblock .down() waiters", async function() {
      const sem = new Semaphore(0)
      const whenDown = sem.down()
      sem.up()

      expect(sem.value).to.equal(0)
      expect(sem.downWaiters).to.be.empty

      await whenDown
    })
  })
})
