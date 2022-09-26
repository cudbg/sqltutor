<script lang="ts">
  //import { createVisualizer, addOn } from "./wst.js"
  import { selectedOpids } from "./stores"
  import LineageStep from "./LineageStep.svelte"
  import { onMount } from "svelte"


  let visEl;

  // to visualize everything get specs for all ops
  // and unzip into list of steps and list of extravises
  // pass to createVisualize() and addon()

  onMount(() => {
  })
  

</script>


<div id="vis" bind:this={visEl}>
  {#each [$selectedOpids].flat() as opid}
    <LineageStep {opid}  />
  {/each}
</div>
