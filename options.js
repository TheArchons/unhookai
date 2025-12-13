function saveOptions(e) {
  e.preventDefault();

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

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);