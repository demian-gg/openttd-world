/**
 * Store system for sharing state between components.
 *
 * Stores provide a way to pass data through the component tree
 * without having to pass props manually at every level.
 *
 * @example
 * ```typescript
 * // Create a store with a default value.
 * const ThemeStore = createStore({ dark: false });
 *
 * // Provide a value (typically in a parent component).
 * provideStore(ThemeStore, { dark: true });
 *
 * // Consume the value (in any descendant component).
 * const theme = getStore(ThemeStore);
 *
 * // Subscribe to changes.
 * subscribeStore(ThemeStore, (state) => {
 *   console.log("Theme changed:", state.dark);
 * });
 *
 * // Notify subscribers when state changes.
 * notifyStore(ThemeStore);
 * ```
 */

import { engineEvents, EngineSetupEvent } from "./events";

/** Subscription callback type. */
export type StoreSubscriber<T> = (value: T) => void;

/** Store definition with unique identifier and optional default. */
export interface Store<T> {
  /** Unique identifier for this store. */
  readonly id: symbol;

  /** Default value if no provider is found. */
  readonly defaultValue?: T;
}

/** Internal store mapping store IDs to values. */
const storeValues = new Map<symbol, unknown>();

/** Internal subscription store mapping store IDs to subscriber sets. */
const storeSubscribers = new Map<symbol, Set<StoreSubscriber<unknown>>>();

/**
 * Create a new store.
 *
 * @param defaultValue - Optional default value when no provider exists.
 * @returns A new store object.
 *
 * @example
 * ```typescript
 * interface UserState {
 *   name: string;
 *   loggedIn: boolean;
 * }
 *
 * const UserStore = createStore<UserState>({
 *   name: "Guest",
 *   loggedIn: false,
 * });
 * ```
 */
export function createStore<T>(defaultValue?: T): Store<T> {
  return {
    id: Symbol(),
    defaultValue,
  };
}

/**
 * Provide a value for a store.
 * This makes the value available to all consumers of the store.
 *
 * @param store - The store to provide a value for.
 * @param value - The value to provide.
 *
 * @example
 * ```typescript
 * provideStore(UserStore, {
 *   name: "Alice",
 *   loggedIn: true,
 * });
 * ```
 */
export function provideStore<T>(store: Store<T>, value: T): void {
  storeValues.set(store.id, value);
}

/**
 * Consume a store value.
 * Returns the provided value, or the default value if no provider exists.
 *
 * @param store - The store to consume.
 * @returns The store value.
 * @throws Error if no provider exists and no default value is defined.
 *
 * @example
 * ```typescript
 * const user = getStore(UserStore);
 * console.log(user.name); // "Alice"
 * ```
 */
export function getStore<T>(store: Store<T>): T {
  const value = storeValues.get(store.id) as T | undefined;

  if (value !== undefined) {
    return value;
  }

  if (store.defaultValue !== undefined) {
    return store.defaultValue;
  }

  throw new Error(
    "Store not provided and no default value defined. " +
      "Ensure provideStore() is called before getStore()."
  );
}

/**
 * Check if a store has been provided.
 *
 * @param store - The store to check.
 * @returns True if the store has a provided value.
 */
export function hasStore<T>(store: Store<T>): boolean {
  return storeValues.has(store.id);
}

/**
 * Clear a store value.
 * Useful for cleanup when a provider component unmounts.
 *
 * @param store - The store to clear.
 */
export function clearStore<T>(store: Store<T>): void {
  storeValues.delete(store.id);
}

/**
 * Clear all store values.
 * Useful for resetting state between scenes or tests.
 */
export function clearAllStores(): void {
  storeValues.clear();
  storeSubscribers.clear();
}

/**
 * Subscribe to store changes.
 * The callback will be invoked whenever notifyStore() is called for this store.
 *
 * @param store - The store to subscribe to.
 * @param callback - Function to call when store changes.
 * @returns Unsubscribe function.
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeStore(ThemeStore, (theme) => {
 *   console.log("Theme changed:", theme.dark);
 * });
 *
 * // Later, to stop listening:
 * unsubscribe();
 * ```
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
 * Notify all subscribers that a store value has changed.
 * Call this after modifying store state to trigger re-renders.
 *
 * @param store - The store that changed.
 *
 * @example
 * ```typescript
 * // In a state setter:
 * setTheme(dark: boolean) {
 *   this.dark = dark;
 *   notifyStore(ThemeStore);
 * }
 * ```
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

/** Store definition returned by defineStore. */
export interface StoreDefinition<T> {
  /** The store instance. */
  store: Store<T>;

  /** Register the store. Must be called before use. */
  register: () => void;

  /** Get the store state. */
  get: () => T;
}

/**
 * Define a new store with a consistent structure.
 * Returns the store, init function, and getter bundled together.
 *
 * @param name - Name of the store (for debugging).
 * @param initializer - Function that creates the initial state.
 * @returns Store definition with store, init, and get.
 *
 * @example
 * ```typescript
 * let count = 0;
 *
 * export const {
 *   store: CounterStore,
 *   init: initCounterStore,
 *   get: getCounterStore,
 * } = defineStore("counter", () => ({
 *   get count() { return count; },
 *   increment() { count++; },
 * }));
 * ```
 */
export function defineStore<T>(
  name: string,
  initializer: () => T
): StoreDefinition<T> {
  const store = createStore<T>();

  return {
    store,
    register: () => provideStore(store, initializer()),
    get: () => getStore(store),
  };
}

// Initialize stores when engine starts.
engineEvents.on(EngineSetupEvent, (event) => {
  const stores = event.config.stores ?? [];
  for (const initStore of stores) {
    initStore();
  }
});
