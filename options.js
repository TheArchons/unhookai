function saveOptions(e) {
  browser.storage.sync.set({
    key: document.querySelector("#key").value,
    whitelist: document.querySelector("#whitelist").value,
    blacklist: document.querySelector("#blacklist").value
  });
}

function restoreOptions() {
  function setCurrentChoice(result, query) {
    document.querySelector(query).value = result;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  browser.storage.sync.get("key")
    .then(value => setCurrentChoice(value.key, "#key"), onError);

  browser.storage.sync.get("whitelist")
    .then(value => setCurrentChoice(value.whitelist, "#whitelist"), onError);

  browser.storage.sync.get("blacklist")
    .then(value => setCurrentChoice(value.blacklist, "#blacklist"), onError);
}

function explanationSubmit(e) {
  e.preventDefault();
  document.body.innerHTML = `
    <form id="saveOptions">
      <label>Openrouter Key <input type="text" id="key" name="Key" /></label>

      <p>Whitelist</p>
      <textarea id="whitelist"></textarea>

      <p>Blacklist</p>
      <textarea id="blacklist"></textarea>

      <button type="submit">Save</button>
    </form>
  `
  restoreOptions();
  document.querySelector("#saveOptions").addEventListener("submit", saveOptions);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#explanation").addEventListener("submit", explanationSubmit);
})