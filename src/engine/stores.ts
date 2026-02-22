/**
 * Store system for sharing state between components.
 *
 * Stores provide a way to pass data through the component tree
 * without having to pass props manually at every level.
 */

import { engineEvents, EngineSetupEvent } from "./events";

/** Subscription callback type. */
export type StoreSubscriber<T> = (value: T) => void;

/** A type representing store definition with unique identifier and optional default. */
export type Store<T> = {
  /** The unique identifier for this store. */
  readonly id: symbol;

  /** The default value if no provider is found. */
  readonly defaultValue?: T;
};

/** A type representing a store definition returned by defineStore. */
export type StoreDefinition<T> = {
  /** The store instance. */
  store: Store<T>;

  /** Initializes the store. Must be called before use. */
  init: () => void;

  /** Gets the store state. */
  get: () => T;
};

/** A type representing a store registration for engine configuration. */
export type StoreRegistration = () => void;

/** The internal store mapping store IDs to values. */
const storeValues = new Map<symbol, unknown>();

/** The internal subscription store mapping store IDs to subscriber sets. */
const storeSubscribers = new Map<symbol, Set<StoreSubscriber<unknown>>>();

/**
 * Creates a new store.
 *
 * @param defaultValue - Optional default value when no provider exists.
 *
 * @returns A new store object.
 */
export function createStore<T>(defaultValue?: T): Store<T> {
  return {
    id: Symbol(),
    defaultValue,
  };
}

/**
 * Provides a value for a store.
 *
 * This makes the value available to all consumers of the store.
 *
 * @param store - The store to provide a value for.
 * @param value - The value to provide.
 */
export function provideStore<T>(store: Store<T>, value: T): void {
  storeValues.set(store.id, value);
}

/**
 * Consumes a store value.
 *
 * Returns the provided value, or the default value if no provider exists.
 *
 * @param store - The store to consume.
 *
 * @returns The store value.
 */
export function getStore<T>(store: Store<T>): T {
  // Try to get provided value.
  const value = storeValues.get(store.id) as T | undefined;

  if (value !== undefined) {
    return value;
  }

  // Fall back to default value.
  if (store.defaultValue !== undefined) {
    return store.defaultValue;
  }

  throw new Error(
    "Store not provided and no default value defined. " +
      "Ensure provideStore() is called before getStore()."
  );
}

/**
 * Subscribes to store changes.
 *
 * The callback will be invoked whenever notifyStore() is called for this store.
 *
 * @param store - The store to subscribe to.
 * @param callback - Function to call when store changes.
 *
 * @returns Unsubscribe function.
 */
export function subscribeStore<T>(
  store: Store<T>,
  callback: StoreSubscriber<T>
): () => void {
  let subscribers = storeSubscribers.get(store.id);
  if (!subscribers) {
    subscribers = new Set();
    storeSubscribers.set(store.id, subscribers);
  }

  subscribers.add(callback as StoreSubscriber<unknown>);

  // Return unsubscribe function.
  return () => {
    subscribers!.delete(callback as StoreSubscriber<unknown>);
  };
}

/**
 * Notifies all subscribers that a store value has changed.
 *
 * Call this after modifying store state to trigger re-renders.
 *
 * @param store - The store that changed.
 */
export function notifyStore<T>(store: Store<T>): void {
  const subscribers = storeSubscribers.get(store.id);
  if (!subscribers || subscribers.size === 0) return;

  const value = storeValues.get(store.id) as T;
  if (value === undefined) return;

  for (const callback of subscribers) {
    callback(value);
  }
}

/**
 * Defines a new store with a consistent structure.
 *
 * Returns the store, init function, and getter bundled together.
 *
 * @param initializer - Function that creates the initial state.
 *
 * @returns Store definition with store, init, and get.
 */
export function defineStore<T>(initializer: () => T): StoreDefinition<T> {
  const store = createStore<T>();

  return {
    store,
    init: () => provideStore(store, initializer()),
    get: () => getStore(store),
  };
}

/**
 * Creates a store registration for engine configuration.
 *
 * Stores are initialized with the engine at startup.
 *
 * @param init - The store's init function from defineStore().
 *
 * @returns A registration for the engine's stores array.
 */
export function store(init: () => void): StoreRegistration {
  return init;
}

// Initialize stores when engine starts.
engineEvents.on(EngineSetupEvent, (event) => {
  const stores = event.config.stores ?? [];
  for (const initStore of stores) {
    initStore();
  }
});
