import 'mocha'
import { expect } from 'chai'

import { tickTock } from './utils'

import OriginalQueue from '../src/Queue'


class Queue<T> extends OriginalQueue<T> {
  get items() {
    return this._items
  }
}


describe("Queue", function() {

  describe("constructor", function() {
    it("should have a default maxSize of Infinity", function() {
      expect(new Queue().maxSize).to.equal(Infinity)
    })

    it("should only accept 0, a positive integer or Infinity as maxSize", function() {
      expect(new Queue(0).maxSize).to.equal(0)
      expect(new Queue(5).maxSize).to.equal(5)
      expect(new Queue(Infinity).maxSize).to.equal(Infinity)

      expect(() => new Queue(null)).to.throw(TypeError)
      expect(() => new Queue(3.5)).to.throw(TypeError)
      expect(() => new Queue(NaN)).to.throw(TypeError)
    })
  })

  describe(".get()", function() {
    it("should obtain an item from a non-empty queue", async function() {
      const queue = new Queue()
      await queue.put('item')
      expect(await queue.get()).to.equal('item')
    })

    it("should wait for an item if the queue is empty", async function() {
      const queue = new Queue()
      const whenGet = queue.get()

      let itemFound = null
      whenGet.then(item => itemFound = item)

      expect(itemFound).to.be.null

      await queue.put('item')
      await tickTock()

      expect(itemFound).to.equal('item')
    })

    it("should return items in the order they were put()", async function() {
      const queue = new Queue()

      await queue.put('item1')
      await queue.put('item2')

      const p1 = queue.get()
      const p2 = queue.get()
      const p3 = queue.get()

      await queue.put('item3')

      const items = await Promise.all([ p1, p2, p3 ])
      expect(items).to.deep.equal([ 'item1', 'item2', 'item3' ])
    })
  })

  describe(".put()", function() {
    it("should push items into non-full queues", async function() {
      const queue = new Queue()

      expect(queue.size).to.equal(0)

      await queue.put('item')

      expect(queue.size).to.equal(1)
      expect(queue.items[0]).to.equal('item')
    })

    it("should wait for an empty slot if the queue is full", async function() {
      const queue = new Queue(1)
      await queue.put('item1')

      const whenPut = queue.put('item2')

      let finishedPut = false
      whenPut.then(_ => finishedPut = true)

      expect(queue.size).to.equal(1)
      expect(finishedPut).to.be.false

      await tickTock() // waiting with the queue full should have no effect

      expect(queue.size).to.equal(1)
      expect(finishedPut).to.be.false

      await queue.get()
      await tickTock() // now, after a slot was freed, whenPut should settle

      expect(queue.size).to.equal(1)
      expect(finishedPut).to.be.true

      await whenPut
    })
  })
})
