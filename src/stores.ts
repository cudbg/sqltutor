import { writable } from "svelte/store"

export let selectedOpids = writable([])
export let lineageData = writable(null)

