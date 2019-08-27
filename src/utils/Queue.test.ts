import Queue from "./Queue";

test("Normal usage", () => {
  expect.assertions(6);

  const queue = new Queue(100);
  expect(queue.getLength()).toEqual(0);

  const item1 = { anyThing: "you want the item to be" };
  const item2 = { anyThingReally: "can be queued" };
  queue.enqueue(item1, item2);
  expect(queue.getLength()).toEqual(2);

  const returnedItem1 = queue.dequeue();
  expect(returnedItem1).toEqual(item1);
  expect(queue.getLength()).toEqual(1);

  const returnedItem2 = queue.dequeue();
  expect(returnedItem2).toEqual(item2);
  expect(queue.getLength()).toEqual(0);
});
