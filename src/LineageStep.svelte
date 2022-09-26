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

  export let opid;

  let info = {},
    addOns = {},
    setupFunction = () => "";
  console.log("lineageStep setup", $lineageData)

  $: {
    info = $lineageData.op_info[opid] ?? {}
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
   setupFunction = functions[info.name] ?? (() => "na")
  }

  let wstVis = null;
  let visEl = null;

  function render() {
    if (opid == null) return
    let wstStep = setupFunction(opid, $lineageData, addOns)
    let spec = {
      type: "sql",
      trace: [wstStep]
    }
    console.log(spec)
    try {
      if (wstVis) wstVis.destroy()
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
  afterUpdate(() => {
    console.log("afterupdate")
    render()
  })
  onDestroy(() => {
    console.log("destroy")
    if (wstVis) wstVis.destroy()
  })
  

</script>


<div class="step">
  <h3 class="stepHeader">{opid} {info.name}</h3>
  <p class="stepDesc">{info.str}</p>
  <div id={`vis-${opid}`} bind:this={visEl}/>
</div>
