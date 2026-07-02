import { debounce } from "./helpers.js";

export function createInstantSearch(input, callback, wait = 160) {
  const handler = debounce((value) => callback(value), wait);
  input.addEventListener("input", (event) => handler(event.target.value));
}
