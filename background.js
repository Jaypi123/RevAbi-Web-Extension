chrome.action.onClicked.addListener((tab) => {
    
    // Open Side Panel
    chrome.sidePanel.open({ tabId: tab.id }, () => {
        console.log("Open Side Panel");
    });
});

chrome.runtime.onInstalled.addListener(() => {
    // Ensure the API is available
    if (!chrome.declarativeContent || !chrome.declarativeContent.onPageChanged) {
        console.error("The declarativeContent API is unavailable.");
        return;
    }

    // Remove any existing rules and add new ones
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostSuffix: ".lazada.com" }
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostSuffix: ".shopee.ph" }
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostSuffix: ".flipkart.com" }
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostSuffix: ".aliexpress.com" }
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostSuffix: ".sephora.ph" }
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostSuffix: ".temu.com" }
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostSuffix: ".zalora.com" }
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostSuffix: ".play.google.com" }
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostSuffix: ".yelp.com" }
                    })
                ],
                actions: [new chrome.declarativeContent.ShowAction()]
            }
        ]);
    });
});

// Define the global variables at the top
let allReviews = [];
let allStarRatings = [];
let allPercentages = [];
let countValue = "";
let totalReviews = "";
let reviewsToShow = 10;  // Number of reviews to show initially

// Function to save data to storage
function saveData() {
    chrome.storage.local.set({
        reviews: allReviews,
        starRatings: allStarRatings,
        percentages: allPercentages,
        count: countValue,
        totalReviews: totalReviews,
        reviewsToShow: reviewsToShow  // Save the number of reviews to show
    }, () => {
        console.log("Data saved to storage.");
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getData") {
        sendResponse({
            reviews: allReviews.slice(0, reviewsToShow),
            starRatings: allStarRatings.slice(0, reviewsToShow),
            sentimentCounts: countValue,  // Add sentiment counts
            pros: allPros,  // Add pros
            cons: allCons   // Add cons
        });
    } else if (request.action === "clearData") {
        allReviews = [];
        allStarRatings = [];
        saveData();
        sendResponse({ success: true });
    } else if (request.action === "startScraping") {
        const tabId = request.tabId;
        scrapeReviews(tabId, sendResponse);
    } else if (request.action === "loadMoreReviews") {
        reviewsToShow += 10;
        sendResponse({
            reviews: allReviews.slice(0, reviewsToShow),
            starRatings: allStarRatings.slice(0, reviewsToShow),
            hasMoreReviews: reviewsToShow < allReviews.length
        });
    }
    return true;
});

// Save data to Chrome storage
function saveData() {
    chrome.storage.local.set({
        reviews: allReviews,
        starRatings: allStarRatings,
        percentages: allPercentages,
        count: countValue,
        totalReviews: totalReviews,
        reviewsToShow: reviewsToShow,
        pros: allPros,  // Save pros data
        cons: allCons   // Save cons data
    });
}