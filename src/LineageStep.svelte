<script lang="ts">
  //import { createVisualizer, addOn } from "./wst.js"
  import {
    projection,
    hashjoin,
    groupby,
    filter,
    scan,
    query
  } from "./util"
  import { select } from "d3-selection"
  import { afterUpdate, onMount, onDestroy } from "svelte"
  import { selectedOpids, lineageData } from "./stores.ts"

  const functions = {
    Project: projection,
    HashJoin: hashjoin,
    ThetaJoin: hashjoin,
    GroupBy: groupby,
    Filter: filter,
    Scan: scan,
    Collect: query
  }

  let errmsg = null;
  export let opid;

  let info = {},
    addOns = {},
    setupFunction = () => "";
  console.log("lineageStep setup", $lineageData)

  $: {
    info = $lineageData.info[opid] ?? {}
    addOns = {
      opID: opid,
      opType: null,
      headerName: info.name,
      desc: null,
      tableCaptions: {
        lhs: null, // no lhs2 for now
        lhs2: null,
        rhs: null,
      }
    }
   setupFunction = functions[info.name] 
   //render()
  }

  let wstVis = null;
  let visEl = null;

  function render() {
    if (opid == null) return
    if (wstVis) wstVis.destroy()

    if (!setupFunction) {
      errmsg = "Don't know how to render this yet :("
      return;
    }
    errmsg = null;
    let wstStep = setupFunction(opid, $lineageData, addOns)
    let spec = { type: "sql", trace: [wstStep] }
    console.log(spec)
    try {
      wstVis = createVisualizer(`#vis-${opid}`, spec)
    } catch (e) { 
      console.error(e)
    } finally {
      handleAddOns()
    }
  }

  function handleAddOns() {
    let step = select(visEl.querySelector(".table_pair"));
    step
      .select(".leftWST .wstRoot")
      .insert("caption", ":first-child")
      .text(addOns.tableCaptions.lhs)

    if(addOns.tableCaptions.lhs2) {
      step
        .select(".leftWST2 .wstRoot")
        .insert("caption", ":first-child")
        .text(addOns.tableCaptions.lhs2)
    }
    step
      .select(".rightWST .wstRoot")
      .insert("caption", ":first-child")
      .text(addOns.tableCaptions.rhs)

  }

  // to visualize everything get specs for all ops
  // and unzip into list of steps and list of extravises
  // pass to createVisualize() and addon()

  onMount(() => {
  })
  afterUpdate(async () => {
    console.log("afterupdate")
    render()
    await tick()
    render()
  })
  onDestroy(() => {
    console.log("destroy")
    if (wstVis) wstVis.destroy()
  })
  

</script>

<style>
  .bd-callout {
    padding: 1.25rem;
    margin-top: 1.25rem;
    margin-bottom: 1.25rem;
    background-color: var(--bd-callout-bg, var(--bs-gray-100));
    border-left: 0.25rem solid var(--bd-callout-border, var(--bs-gray-300));
  }

</style>

<div class="step">
  <h3 class="stepHeader">{info.name} <small class="text-muted">id: {info.id}</h3>
  <p class="stepDesc">{info.str}</p>
  <div id={`vis-${opid}`} bind:this={visEl}/>
  {#if errmsg}
  <div class="bd-callout">
    <p>
    {errmsg}
    </p>
    <p>
    Help us <a href="https://github.com/cudbg/sqltutor">add it to the codebase</a>!
    </p>
  </div>
  {/if}
</div>
