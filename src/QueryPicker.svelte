<script lang="ts">
  import { queries } from "./qs"

  export let onSelect;
  let selected;

  function handleSubmit() {
    if (selected)
      onSelect(selected)
  }

</script>
<style>
  select {
    width: 70%;
    display: inline;
  }

</style>
<select bind:value={selected} on:change={handleSubmit} class="" aria-label="Select a query">
  <option selected value={null}>Choose a query</option>
  {#each queries as { name, q }, i}
    <option value={q}>{name}</option>
  {/each}
</select>
