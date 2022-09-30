<script lang="ts">
  import { onMount } from "svelte"
  export let id, reportBug;


  let comment = null;
  let email = null;
  let thanksVisible = false;


  let modal = null; 
  let modalEl = null;

  onMount(() => {
    modal = new bootstrap.Modal('#' + id, { })
    modalEl.addEventListener("hidden.bs.modal", () => {
    $: thanksVisible = false;
    })

  })
  function onClick() {
    reportBug(comment, email)
    comment = email = null;
    thanksVisible = true;
    setTimeout(() => { 
      modal.hide()
    }, 600)
  }

</script>
<style>
  textarea {
    width: 100%;
    min-height: 20em;
    height:100%;
  }
  input {
    width: 100%;
  }
</style>

<!-- Modal -->
<div class="modal fade" id={id} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" bind:this={modalEl}>
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-body">
        {#if thanksVisible}
          Thanks!
        {:else}
          <textarea bind:value={comment} placeholder="Optionally describe the expected functionality, error, or feature request."/>
          <input bind:value={email} placeholder="Optional email if you want a reply"/>
        {/if}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" on:click={onClick}>Submit</button>
      </div>
    </div>
  </div>
</div>
