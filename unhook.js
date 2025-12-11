const delayTime = 5000
const recheckTime = 600000

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
        stream: false,
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

    // console.log(response)

    response = await response.json()

    //console.log(response)

    if (response?.choices?.[0]?.message?.content !== "TRUE") {
        setTimeout(ready, recheckTime); // check again in 5 minutes in case of a page navigation or something
        return; // Either error or the page is productive, so we ignore
    }

    document.body.innerHTML = `
        <h1 style="color: white">Are you procrastinating?</h1>
        <p style="color: white">The AI gods say you are. If you truly aren't, type an at least 50 character explanation for why need to visit this page.</p>
        <form id="bypassForm">
            <textarea minlength="50" style="color: black" required></textarea>
            <input type="submit" value="Submit" />
        </form>
    `;

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

function main() {
    if (document.cookie.includes('BypassUnhook=True;')) {
        document.cookie = 'BypassUnhook=False';
        setTimeout(ready, recheckTime)
    } else {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => setTimeout(ready, delayTime));
        } else {
            setTimeout(ready, delayTime);
        }
    }
}

main();