const delayTime = 5000
const bypassTime = 600000
const recheckTime = 60000

async function ready() {
    //console.log(document.cookie)


    if (document.hidden) {
        //console.log("page hidden, waiting...")
        setTimeout(ready, delayTime)
        return;
    }

    content = document.body.innerText
    key = (await browser.storage.sync.get("key")).key;
    // console.log(key);
    //console.log(`innerText: ${content}`)

    let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'openai/gpt-oss-20b:free',
            messages: [
            {
                role: 'user',
                content: `You are an AI that automatically determines if the site the user is on is one that is productive or they are procrastinating. If the user is on the main page of sites that can either be productive or not, err on the safe side. For example, the youtube subscriptions page should be allowed. Return only the word "TRUE" if the user is on procrastinating content, and "FALSE" otherwise. ONLY return TRUE/FALSE, do not say anything else.\n${content}`,
            },
            ],
        }),
    })

    // console.log(`You are an AI that automatically determines if the site the user is on is one that is productive or they are procrastinating. If the user is on the main page of sites that can either be productive or not, err on the safe side. For example, the youtube subscriptions page should be allowed. Return only the word "TRUE" if the user is on procrastinating content, and "FALSE" otherwise. ONLY return TRUE/FALSE, do not say anything else.\nURL: ${window.location.href}\n${content}`);

    console.log(response)

    response = await response.json()

    console.log(response)

    if (response?.choices?.[0]?.message?.content !== "TRUE") {
        console.log(`rechecking in ${recheckTime}`)
        setTimeout(ready, recheckTime); // check again later in case of a page navigation or something
        return; // Either error or the page is productive, so we ignore
    }

    block(response.choices[0].message.reasoning);
}

function block(reasoning) {
    document.body.innerHTML = `
        <h1 style="color: white">Are you procrastinating?</h1>
        <p style="color: white">The AI gods say you are. If you truly aren't, type an at least 50 character explanation for why need to visit this page.</p>
        <form id="bypassForm">
            <textarea minlength="50" style="color: black" required></textarea>
            <input type="submit" value="Submit" />
        </form>
        <p style="color: white" id="reasoning"></p>
    `;

    document.getElementById("reasoning").textContent = `Reasoning: ${reasoning}`;

    document.body.style.backgroundColor = 'black';

    document.getElementById("bypassForm").addEventListener("submit", (e) => {
        e.preventDefault();
        bypass(e);
    });
}

function bypass(e) {
    //console.log(`form`);
    //console.log(e);
    document.cookie = 'BypassUnhook=True'
    window.location.reload();
}

function inList(listText, match) {
    const list = listText.split("\n");
    console.log(list)

    // If the listText is empty we ignore the regex since an empty string matches everything
    return listText && list.some(item => match.match(item))
}

async function main() {
    let {whitelist: whiteListText, blacklist: blacklistText} = await browser.storage.sync.get(['whitelist', 'blacklist']);
    // console.log("whitelist")
    // console.log(whiteListText, blacklistText)

    if (inList(whiteListText, window.location.href)) {
        console.log("whitelisted");
        return;
    }

    if (inList(blacklistText, window.location.href)) {
        block("Blacklisted Website")
        return;
    }
    
    if (document.cookie.includes('BypassUnhook=True;')) {
        document.cookie = 'BypassUnhook=False';
        setTimeout(ready, bypassTime)
        return;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => setTimeout(ready, delayTime));
    } else {
        setTimeout(ready, delayTime);
    }
}

main();