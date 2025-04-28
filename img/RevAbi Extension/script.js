// BUTTONS
const filtermore_btn = document.getElementById("filtermore_btn")
const settings_btn = document.getElementById("settings")

// Filter Button
document.getElementById('settings').addEventListener('click', showPopup);

// Close Button
document.querySelector('.close-btn').addEventListener('click', hidePopup);

// Show Popup Function
function showPopup() {
    document.getElementById('container').style.display = 'block';
}

// Hide Popup Function
function hidePopup() {
    document.getElementById('container').style.display = 'none';
}

// test lang kung gumagana
filtermore_btn.onclick = () => {
	chrome.runtime.sendMessage({event: 'onStart' })
}

settings_btn.onclick = () => {
	chrome.runtime.sendMessage({event: 'onStop'})
}


/* Settings
document.addEventListener("DOMContentLoaded", function() {
    const layoutSelect = document.getElementById("layout");
    const themeSelect = document.getElementById("theme");
    const textSizeInput = document.getElementById("text-size");
    const content = document.querySelector(".content");

    // Event listener for layout selection
    layoutSelect.addEventListener("change", function() {
        const selectedLayout = layoutSelect.value;
        content.style.display = selectedLayout === "grid" ? "grid" : "block";
    });

    // Event listener for theme selection
    themeSelect.addEventListener("change", function() {
        const selectedTheme = themeSelect.value;
        document.body.className = selectedTheme;
    });

    // Event listener for text size adjustment
    textSizeInput.addEventListener("input", function() {
        const textSize = textSizeInput.value + "px";
        content.style.fontSize = textSize;
    });
});

*/ 


/*

let scrape_reviews = document.getElementById('scrape_reviews');
let	list = document..getElementById('review_list');

chrome.runtime.onMessage.addEventListener((request, sender, sendResponse) => {
	let reviews = request.reviews;

	if (reviews = null || eamils.length == 0) {
		alert(reviews);
	}
})

scrape_reviews.addEventListener("click", async () => {
	let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

	chrome.scripting.executeScript ({
		target: {tabId: tab.id},
		func: scrapeReviewsFromPage,
	});
})

function scrapeReviewsFromPage() {
	const dateRegex = /^(0[1-9]|[12][0-9]|3[01]) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/;

	let reviews = document.body.innerHTML.match(dateRegex);
	chrome.runtime.sendMessage({reviews});
}
*/
