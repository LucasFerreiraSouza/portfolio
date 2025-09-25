const { AsyncLocalStorage } = require("async_hooks");

const asyncLocalStorage = new AsyncLocalStorage();

function setActor(user) {
  const store = asyncLocalStorage.getStore() || new Map();
  store.set("actor", user);
  asyncLocalStorage.enterWith(store);
}

function getActor() {
  return asyncLocalStorage.getStore()?.get("actor") || null;
}

module.exports = { setActor, getActor, asyncLocalStorage };
