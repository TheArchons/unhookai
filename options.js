function saveOptions(e) {
  browser.storage.sync.set({
    providerUrl: document.querySelector("#providerUrl").value,
    key: document.querySelector("#key").value,
    model: document.querySelector("#model").value,
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

  browser.storage.sync.get("providerUrl")
    .then(value => setCurrentChoice(value.providerUrl === undefined ? "https://openrouter.ai/api/v1/chat/completions" : value.providerUrl, "#providerUrl"), onError);

  browser.storage.sync.get("key")
    .then(value => setCurrentChoice(value.key, "#key"), onError);

  browser.storage.sync.get("model")
    .then(value => setCurrentChoice(value.model === undefined ? "deepseek/deepseek-r1-0528:free" : value.model, "#model"), onError);

  browser.storage.sync.get("whitelist")
    .then(value => setCurrentChoice(value.whitelist, "#whitelist"), onError);

  browser.storage.sync.get("blacklist")
    .then(value => setCurrentChoice(value.blacklist, "#blacklist"), onError);
}

function explanationSubmit(e) {
  e.preventDefault();
  document.body.innerHTML = `
    <form id="saveOptions">
      <label>Provider URL <input type="text" id="providerUrl" name="providerUrl" placeholder="https://openrouter.ai/api/v1/chat/completions" /></label>
      <br>
      <label>API Key <input type="text" id="key" name="Key" /></label>
      <br>
      <label for="model">Model</label>
      <input type="text" id="model" name="model" /></input>

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