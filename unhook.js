const delayTime = 5000
const bypassTime = 60000
const recheckTime = 60000
const blacklistRecheckTime = 5000

async function ready() {
    //console.log(document.cookie)


    if (document.hidden) {
        //console.log("page hidden, waiting...")
        setTimeout(ready, delayTime)
        return;
    }

    content = document.body.innerText
    key = (await browser.storage.sync.get("key")).key;
    model = (await browser.storage.sync.get("model")).model;
    model = model === undefined ? "deepseek/deepseek-r1-0528:free" : model
    providerUrl = (await browser.storage.sync.get("providerUrl")).providerUrl;
    providerUrl = providerUrl === undefined ? "https://openrouter.ai/api/v1/chat/completions" : providerUrl
    // console.log(model);
    // console.log(key);
    //console.log(`innerText: ${content}`)

    let response = await fetch(providerUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            temperature: 0,
            reasoning_effort: "low",
            messages: [
                
            {
                role: 'user',
                content: `You are an AI that automatically determines if the page the user is seeing is one that is productive or they are procrastinating. If you have no (or little) evidence that the site is not productive (including if it links to an unproductive site but the current site itself is not unproductive), respond "FALSE". Return only the word "TRUE" if you are sure the user is on procrastinating content, and "FALSE" otherwise. Allow captcha pages and check the title of videos before deciding whether or not to block them. ONLY return TRUE/FALSE, do not say anything else.\n${content}`,
            },
            ],
        }),
    })

    console.log(response)

    response = await response.json()

    console.log(response)

    if (response?.choices?.[0]?.message?.content) {
        // get the <reasoning></reasoning> if it exists
        const content = response.choices[0].message.content;
        const reasoningMatch = content.match(/<reasoning>(.*?)<\/reasoning>/s);
        if (reasoningMatch) {
            response.choices[0].message.reasoning = reasoningMatch[1].trim();
            response.choices[0].message.content = content.replace(/<reasoning>.*?<\/reasoning>/s, '').trim();
        }
    }

    if (response?.choices?.[0]?.message?.content !== "TRUE") {
        console.log(`rechecking in ${recheckTime}`)
        setTimeout(ready, recheckTime); // check again later in case of a page navigation or something
        return; // Either error or the page is productive, so we ignore
    }

    block(response.choices[0].message.reasoning, content, providerUrl);
}

function block(reasoning, pageContent) {
    document.body.innerHTML = `
        <h1 style="color: white">Are you procrastinating?</h1>
        <p style="color: white">The AI gods say you are. If you truly aren't, type an at least 50 character explanation for why need to visit this page.</p>
        <form id="bypassForm">
            <textarea minlength="50" style="color: black" id="bypass-explanation" required></textarea>
            <input type="submit" value="Submit" />
        </form>
        <p style="color: white" id="reasoning"></p>
    `;

    document.getElementById("reasoning").textContent = `Reasoning: ${reasoning}`;

    document.body.style.backgroundColor = 'black';

    document.getElementById("bypassForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const explanation = document.getElementById("bypass-explanation").value;

        console.log(pageContent);
        key = (await browser.storage.sync.get("key")).key;
        model = (await browser.storage.sync.get("model")).model;
        model = model === undefined ? "deepseek/deepseek-r1-0528:free" : model
        providerUrl = (await browser.storage.sync.get("providerUrl")).providerUrl;
        providerUrl = providerUrl === undefined ? "https://openrouter.ai/api/v1/chat/completions" : providerUrl
        
        let response = await fetch(providerUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                temperature: 0,
                reasoning_effort: "low",
                messages: [
                {
                    role: 'user',
                    content: `You are an AI that automatically determines if the page the user is seeing is one that is productive or they are procrastinating. If you have no (or little) evidence that the site is not productive (including if it links to an unproductive site but the current site itself is not unproductive) then do not consider it an unproductive site. Allow captcha pages, error pages, etc. Check the title of videos before deciding whether or not to block them. This is the content:\n${pageContent}\nYou previously said TRUE because of the following reason:\n${reasoning}\nBut the user disagrees with you, because of the following reasoning\n${explanation}. Does their reasoning make sense? Their reason must be to justify why this site helps them with their productivity. An example valid reason might be that the youtube video they are watching is a math lecture. Example invalid reasons include saying they are just tired and need a break, or just a bunch of nonsensical characters. Respond "TRUE" if it does and "FALSE" if it doesnt. Return ONLY TRUE/FALSE, nothing else.`,
                },
                ],
            }),
        })

        response = await response.json()

        console.log(`innerText: ${pageContent}`)
        console.log(response);
        console.log(response?.choices?.[0]?.message?.content);

        // get the <reasoning></reasoning> if it exists
        const content = response.choices[0].message.content;
        const reasoningMatch = content.match(/<reasoning>(.*?)<\/reasoning>/s);
        if (reasoningMatch) {
            response.choices[0].message.reasoning = reasoningMatch[1].trim();
            response.choices[0].message.content = content.replace(/<reasoning>.*?<\/reasoning>/s, '').trim();
        }
        
        if (response?.choices?.[0]?.message?.content === "TRUE") {
            console.log("bypassing")
            bypass(e);
        } else {
            alert(`No ${reasoningMatch}`);
        }


    });
}

function bypass(e) {
    //console.log(`form`);
    //console.log(e);
    document.cookie = `BypassUnhook=${Date.now() + bypassTime}`;
    window.location.reload();
}

function inList(listText, match) {
    const list = listText.split("\n");
    // console.log(list)

    // If the listText is empty we ignore the regex since an empty string matches everything
    return listText && list.some(item => match.match(item))
}

function checkBlacklist(blacklistText) {
    // console.log('Checking blacklist', blacklistText)
    if (inList(blacklistText, window.location.href)) {
        block("Blacklisted Website", window.location.href);
        return true;
    }
    setTimeout(() => checkBlacklist(blacklistText), blacklistRecheckTime)
    return false;
}

function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

async function main() {
    const bypass = getCookie('BypassUnhook');
    if (bypass && bypass > Date.now()) {
        setTimeout(ready, bypass - Date.now());
        return;
    }
    let {whitelist: whiteListText, blacklist: blacklistText} = await browser.storage.sync.get(['whitelist', 'blacklist']);
    // console.log("whitelist")
    // console.log(whiteListText, blacklistText)

    if (inList(whiteListText, window.location.href)) {
        // console.log("whitelisted");
        return;
    }

    checkBlacklist(blacklistText);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => setTimeout(ready, delayTime));
    } else {
        setTimeout(ready, delayTime);
    }
}

main();
