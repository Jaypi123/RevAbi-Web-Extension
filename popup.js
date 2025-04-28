let allReviews = []; // Array to hold all scraped reviews
let allStarRatings = []; // Array to hold star ratings as symbols
let allPercentages = []; // Array to hold the scraped percentages
let totalScrapedReviews = 0; // Counter for total scraped reviews
let countValue = ""; // Variable to hold the scraped count
let totalReviews = ""; // Declare totalReviews at the top level
let currentDisplayIndex = 0; // Track the number of reviews currently displayed
let isScraping = false; // Flag to indicate if scraping is in progress
let pagesScraped = 0;
const SHOPEE_LAZADA_PAGES = 5;
const SEPHORA_YELP_FLIPKART_PAGES = 5;

document.addEventListener('DOMContentLoaded', () => {
    const scrapeButton = document.getElementById('scrape-button');
    const moreButton = document.getElementById('filtermore_btn');

    // Load saved data from storage
    chrome.runtime.sendMessage({ action: "getData" }, (response) => {
        allReviews = response.reviews || [];
        allStarRatings = response.starRatings || [];
        allPercentages = response.percentages || [];
        countValue = response.count || "";
        totalReviews = response.totalReviews || "";

        totalScrapedReviews = allReviews.length;
        currentDisplayIndex = Math.min(10, totalScrapedReviews);

        if (allReviews.length > 0) {
            updateUI();
        } else {
            alert("No reviews available.");
        }
    });

    // Start Scraping Reviews
    scrapeButton.addEventListener('click', () => {
        if (isScraping) return;

        isScraping = true;
        scrapeButton.textContent = "Scraping...";
        scrapeButton.disabled = true;

        // Send message to clear old data
        chrome.runtime.sendMessage({ action: "clearData" }, () => {
            // Reset local data variables
            allReviews = [];
            allStarRatings = [];
            allPercentages = [];
            countValue = "";
            totalReviews = "";
            totalScrapedReviews = 0;
            currentDisplayIndex = 0;
            pagesScraped = 0;

            // Start scraping after clearing data
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                scrapeNextPage(tabs[0].id);
            });
        });
    });

// Load more reviews (for infinite scrolling or pagination)
moreButton.addEventListener('click', () => {
    if (currentDisplayIndex < totalScrapedReviews) {
        currentDisplayIndex += 10;
        updateUI();
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            scrapeNextPage(tabs[0].id);
        });
    }
});

    // Load more reviews (for infinite scrolling or pagination)
    moreButton.addEventListener('click', () => {
        if (currentDisplayIndex < totalScrapedReviews) {
            currentDisplayIndex += 10;
            updateUI();
        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                scrapeNextPage(tabs[0].id);
            });
        }
    });
});

// Recursive function to scrape multiple pages
function scrapeNextPage(tabId) {
    let maxPages = SHOPEE_LAZADA_PAGES;

    // Determine max pages based on the website
    if (window.location.hostname.includes("sephora") || window.location.hostname.includes("yelp") || window.location.hostname.includes("flipkart")) {
        maxPages = SEPHORA_YELP_FLIPKART_PAGES;
    }

    if (pagesScraped >= maxPages) {
        // Stop if the maximum page limit is reached
        updateUI();
        isScraping = false;
        document.getElementById('scrape-button').textContent = "Scrape Again"; // Change button text after scraping is complete
        document.getElementById('scrape-button').disabled = false; // Enable the button again
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: scrapeReviewsPercentagesAndCount
    }, (results) => {
        if (results[0] && results[0].result) {
            const { reviews: newReviews, starRatings: newStarRatings, percentages: newPercentages, count, totalReviews: newTotalReviews } = results[0].result;

            // Filter out duplicate reviews
            newReviews.forEach((review, index) => {
                if (!allReviews.includes(review)) {
                    allReviews.push(review);
                    allStarRatings.push(newStarRatings[index]);
                }
            });

            allPercentages = newPercentages; // Assuming percentages do not change across pages
            countValue = count;
            totalReviews = newTotalReviews;

            totalScrapedReviews = allReviews.length;
            currentDisplayIndex = Math.min(10, totalScrapedReviews);

            chrome.runtime.sendMessage({
                action: "setData",
                data: {
                    reviews: allReviews,
                    starRatings: allStarRatings,
                    percentages: allPercentages,
                    count: countValue,
                    totalReviews: totalReviews
                }
            });
            
            // After scraping is complete, send data to backend
            sendReviewsToBackend(allReviews, allStarRatings);

            pagesScraped++;
            goToNextPage(tabId);
        }
    });
}

function goToNextPage(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
            let nextButton = null;

            // Shopee: Has "Next" button
            if (window.location.hostname.includes("shopee")) {
                nextButton = document.querySelector('button.shopee-icon-button.shopee-icon-button--right');
            }
            // Lazada: Has "Next" button
            else if (window.location.hostname.includes("lazada")) {
                nextButton = document.querySelector('.next-icon.next-icon-arrow-right.next-icon-medium.next-icon-last');
            }
            // Sephora: Has "Next" button
            else if (window.location.hostname.includes("sephora")) {
                nextButton = document.querySelector('a.page.next');
            }
            // Yelp: Has "Next" button
            else if (window.location.hostname.includes("yelp")) {
                nextButton = document.querySelector('a.next-link, .navigation-button__09f24__m9qRz.y-css-7ln3jw');
            }
            // Flipkart: Has "Next" button (use text content to differentiate Previous and Next)
            else if (window.location.hostname.includes("flipkart")) {
                const buttons = document.querySelectorAll('a._9QVEpD');
                
                // Loop through buttons and find the "Next" button by its text content
                nextButton = Array.from(buttons).find(button => button.textContent.includes('Next'));
            }

            // If there is a "Next" button, click it
            if (nextButton) {
                nextButton.click();
            } else {
                console.error("Next button not found for this site, and no infinite scroll detected.");
            }
        }
    }, () => {
        setTimeout(() => {
            scrapeNextPage(tabId); // Call the function to scrape next page (or scroll again)
        }, 2000); // Wait for 2 seconds to allow more content to load after scroll
    });
}


// Function to scrape reviews, percentages, and count from the page
function scrapeReviewsPercentagesAndCount() {
    let reviews = [];
    let percentages = [];
    let starRatings = [];
    let count = "";
    let totalReviews = ""; 

    // Check if the website is valid
    const isShopee = document.querySelector('.shopee-product-rating__main') !== null;
    const isPlaystore = document.querySelector('.h3YV2d') !== null;
    const isZalora = document.querySelector('.pt-5') !== null;
    const isAliExpress = document.querySelector('.list--itemContent--onkwE7H') !== null;
    const isSephora = document.querySelector('.review-text') !== null;
    const isYelp = document.querySelector('span.raw__09f24__T4Ezm') !== null;
    const isTemu = document.querySelector('._2EO0yd2j') !== null;
    const isFlipkart = document.querySelector('.ZmyHeo') !== null;
    

    if (isShopee) {
       // Select all relevant div elements containing reviews
        const reviewNodes = document.querySelectorAll('div[style*="position: relative"]');

        // Iterate through each node, starting from the second one to skip the first review
        reviewNodes.forEach((node, index) => {
            if (index > 0) { // Skip the first review (index 0)
                reviews.push(node.innerText.trim());
            }
        });

        // Scrape percentages for Shopee
        const percentageNodes = document.querySelectorAll('.product-rating-overview__filter');
        percentageNodes.forEach((node, index) => {
            // Check if the index is between 1 and 5 (inclusive)
            if (index >= 1 && index <= 5) {
                let text = node.innerText.trim();

                // Clean the text to remove unwanted parts
                text = text.replace(/^\d+ Star\s*/g, ''); // Remove the initial number and 'Star'

                if (text.trim() && text.includes('(')) {
                    // Remove parentheses
                    text = text.replace(/[()]/g, '');

                    // Handle 'K' (convert '9.8K' to '9800')
                    if (text.includes('K')) {
                        text = text.replace(/(\d+(\.\d+)?)K/, (match, p1) => {
                            return Math.round(parseFloat(p1) * 1000);
                        });
                    }

                    // Push the cleaned text to percentages array
                    percentages.push(text.trim());
                }
            }
        });
  
    // Scrape star ratings for Shopee               
        const starNodes = document.querySelectorAll('.shopee-product-rating__rating'); 
        starNodes.forEach(node => {
            // Select filled stars (active)
            const filledStars = node.querySelectorAll('svg.shopee-svg-icon.icon-rating-solid--active');

            // Count filled stars
            const starCount = filledStars.length; // Get the number of filled stars

            if (starCount <= 5) {
                starRatings.push(starCount); 
            }
        });

        // Convert star ratings to star symbols
        starSymbols = starRatings.map(count => '&starf;'.repeat(count) + '&star;'.repeat(5 - count));
       
        // Scrape count for Shopee
        const countNode = document.querySelector('.dQEiAI');
        if (countNode) {
            count = countNode.innerText.trim();
        }

        // Select the total reviews/ratings node
        const totalReviewsNode = document.querySelector('.flex.asFzUa'); 
        if (totalReviewsNode) {
            totalReviews = totalReviewsNode.innerText.trim(); 

            // Extract the part that contains "K" and remove the "+"
            let match = totalReviews.match(/(\d+(\.\d+)?)K\+/); // Match to data '10K+'
            if (match) {
                // Convert '10K' to '10000'
                totalReviews = Math.round(parseFloat(match[1]) * 1000);
            }
        }

    } else if (isPlaystore) { // YUNG count nalang 
            // Scrape reviews for Playstore
            const reviewNodes = document.querySelectorAll('.h3YV2d');
            reviewNodes.forEach(node => {
                reviews.push(node.innerText.trim());
            });
    
            // Scrape count for Shopee
            const countNode = document.querySelector('.jILTFe');
                if (countNode) {
                    count = countNode.innerText.trim();
                }
            
            // scrape number of reviews per star
            const ratingNodes = document.querySelectorAll('.JzwBgb');   
            for (const node of ratingNodes) {
                const ratingTitle = node.getAttribute('aria-label');  
                if (ratingTitle) {
                    // Use a regex to extract the number from the ratingTitle
                    const match = ratingTitle.match(/(\d{1,3}(?:,\d{3})*)/); // Matches numbers with commas
                    if (match) {
                        percentages.push(match[0]);  // append/push into the array percentages
                    }
                }
            }
                
             // Scrape star ratings
            const starNodes = document.querySelectorAll('.Jx4nYe'); // Adjusted selector for each star rating container

            starNodes.forEach(node => {
                // Select only filled stars within this container
                const filledStars = node.querySelectorAll('span.notranslate.Z1Dz7b'); // Select all filled stars

                // Count the number of filled stars
                const starCount = filledStars.length;

                // Ensure the star rating is between 1 and 5
                if (starCount >= 1 && starCount <= 5) {
                    starRatings.push(starCount); // Add the star rating to the array
                }
            });

            // Convert star ratings to star symbols
            starSymbols = starRatings.map(count => '★'.repeat(count) + '☆'.repeat(5 - count));

    } else if (isZalora) { // Ayaw lumabas ng percentage amp. update: ayaw talaga huhu ayusin ko bukas
        // Scrape reviews for Zalora
        const reviewNodes = document.querySelectorAll('.mt-2.flex.flex-wrap.gap-1');
        // Skip the first 4 reviews
        reviewNodes.forEach((node, index) => {
            if (index >= 4) { // Start from the 5th review (index 4)
                reviews.push(node.innerText.trim());
            }
        });

        // Scrape percentages for Zalora
        const percentageNodes = document.querySelectorAll('div.mt-2.space-y-1');  
        percentageNodes.forEach(node => {
            percentages.push(node.innerText.trim());
        });

        // Scrape count for Zalora
        const countNodes = document.querySelectorAll('.text-\\[32px\\].font-medium'); 
        // Check if any nodes were found
        if (countNodes.length > 0) {
            countNodes.forEach(node => {
                count += node.innerText + " ";  
            });
            count = count.replace(/\/5.*/, ''); // Remove any spaces
        } 
        
        const totalReviewsNode = document.querySelector('.inline-flex.gap-1'); 
        if (totalReviewsNode) {
            totalReviews = totalReviewsNode.innerText.trim(); // Store the total reviews
        }

        // Scrape star ratings for Zalora ( HINDI PA MAAYOS! )
        const starContainers = document.querySelectorAll('span.inline-flex.gap-1'); // Select the containers that hold the stars

        starContainers.forEach(container => {
            const stars = container.querySelectorAll('svg'); // Properly escape special characters in the class names
            let starCount = 0; 

            stars.forEach(star => {
                const pathElement = star.querySelector('path'); // Get the <path> element inside the SVG

                if (pathElement) {
                    const dAttribute = pathElement.getAttribute('d'); // Get the 'd' attribute of the <path> element

                    // Check if 'd' attribute starts with 'M5.131' (filled star)
                    if (dAttribute && dAttribute.startsWith('M5.131')) {
                        starCount++; // Increment for filled stars
                    }
                   
                }
            });

            // Push the total star count for this review into the starRatings array
            starRatings.push(starCount);
        });

        // Remove the first 19 star ratings
        if (starRatings.length > 4) {
            starRatings.splice(0, 4);
        }

        // Convert star ratings to star symbols (e.g., ★ for filled, ☆ for empty)
        starSymbols = starRatings.map(count => '★'.repeat(count) + '☆'.repeat(5 - count));

    } else if (isAliExpress) { // Goods na pero umuulit yung sa Count
        // Scrape reviews for AliExpress
        const reviewNodes = document.querySelectorAll('list--itemReview--d9Z9Z5Z'); 
        // Skip the first 4 reviews
        reviewNodes.forEach((node, index) => {
            if (index >= 4) { // Start from the 5th review (index 4)
                reviews.push(node.innerText.trim());
            }
        });

        // Scrape percentages for AliExpress
        const percentageNodes = document.querySelectorAll('.a2g0o.detail.0.i15.65ffsmvxsmvx5f');
            percentageNodes.forEach(node => {
                const percentage = node.innerText.trim();
                // Alisin yung duplicate
                if (!percentages.includes(percentage)) {
                    percentages.push(percentage);
                }
        });

        // Scrape count for AliExpress
        const countNode = document.querySelector('span.title--rating--wzOw1ph'); 
        if (countNode) {
            count = countNode.innerText.trim();
        }

        const totalReviewsNode = document.querySelector('.filter--filterItem--udTNLrr.filter--active--JGzZ0BK'); 
        if (totalReviewsNode) {
            totalReviews = totalReviewsNode.innerText.trim();
        }

        // Select all the div elements that contain the star ratings
        const starNodes = document.querySelectorAll('.stars--box--WrrveRu');

        // Skip the first 12 star ratings
        starNodes.forEach((node, index) => {
            if (index >= 16) { // Start from the 13th star rating (index 12)
                const filledStars = node.querySelectorAll('span.comet-icon.comet-icon-starreviewfilled');

                // Count the number of filled stars
                const starCount = filledStars.length;

                // Ensure the star rating is between 1 and 5
                if (starCount >= 1 && starCount <= 5) {
                    starRatings.push(starCount); // Add the star rating to the array
                }
            }
        });

        // Convert star ratings to star symbols
        starSymbols = starRatings.map(count => '★'.repeat(count) + '☆'.repeat(5 - count));


    } else if (isSephora) { 
        // Ayusin pa, konti na lang
        const reviewNodes = document.querySelectorAll('.review-text');
        reviewNodes.forEach(node => {
        reviews.push(node.innerText.trim());
        });

        // Scrape percentages for Sephora
        const percentageNodes = document.querySelectorAll('.col-md-1.bar-value');
        percentageNodes.forEach(node => {
            percentages.push(node.innerText.trim());
        });

        // Scrape count for Sephora
        const countNode = document.querySelector('div.row.averate-rating'); 
        if (countNode) {
            count = countNode.innerText.trim();
        }

        const totalReviewsNode = document.querySelector('.row.total-review'); 
        if (totalReviewsNode) {
            totalReviews = totalReviewsNode.innerText.trim(); 
        }

        // Select all the review containers that contain the star ratings
        const starNodes = document.querySelectorAll('div.rateit-range');

        let firstFourStarSkipped = false; // Flag to track the first 4-star rating
        const starRatings = []; // Array to store the ratings

        starNodes.forEach((node) => {
            // Get the value from the aria-valuenow contains the star rating
            const starRating = parseFloat(node.getAttribute('aria-valuenow'));

            // Check if the aria-valuenow attribute is present
            if (!isNaN(starRating)) {
                // Round the star rating to the nearest integer for full star ratings
                const roundedRating = Math.round(starRating);

                // Ensure the star rating is valid (between 1 and 5)
                if (roundedRating >= 1 && roundedRating <= 5) {
                    // Skip the first 4-star rating
                    if (roundedRating === 4 && !firstFourStarSkipped) {
                        firstFourStarSkipped = true; // Skip the first 4-star rating
                        return; // Skip this iteration
                    }

                    // Add the rounded star rating to the array
                    starRatings.push(roundedRating);
                }
            } else {
                console.log('No aria-valuenow attribute found for this node.');
            }
        });

        // Convert star ratings to star symbols (full stars + empty stars)
        const starSymbols = starRatings.map(count => '★'.repeat(count) + '☆'.repeat(5 - count));

    } else if (isYelp) { // Goods na goods na
        // Scrape reviews for Sephora
        const reviewNodes = document.querySelectorAll('span. raw__09f24__T4Ezm');
        // Skip the first 2 reviews
        reviewNodes.forEach((node, index) => {
            if (index >= 4) { // Start from the 5th review (index 4)
                reviews.push(node.innerText.trim());
            }
        });

        // Scrape count for Sephora
        const countNodes = document.querySelectorAll('.y-css-1om4a3q');
        for (const node of countNodes) {
            const ratingTitle = node.getAttribute('aria-label');  
                if (ratingTitle) {
                    count = ratingTitle.replace(/star rating/i, '').trim();  // alisin yung unnecessary text
                        break;  // Stop after the first valid rating is found
                    }
        }

        const totalReviewsNode = document.querySelector('span.y-css-yrt0i5'); 
        if (totalReviewsNode) {
            totalReviews = totalReviewsNode.innerText.trim(); // Store the total reviews
        }
           
        // Select the div with the star rating
        const countNode = document.querySelector('.y-css-f0t6x4[role="img"]'); // Select the element with class 'y-css-f0t6x4' and role 'img'

        if (countNode) {
            // Get the aria-label attribute value
            const starRating = countNode.getAttribute('aria-label').trim();

            // Extract the numerical part of the aria-label (e.g., '3.5 star rating')
            count = starRating.match(/[\d.]+/)[0]; // This will extract '3.5'
        }

        // Select all the div elements that contain the star ratings
        const starNodes = document.querySelectorAll('.y-css-1jwbncq');

        starNodes.forEach(node => {
            const filledStars = node.querySelectorAll('.y-css-1tnjuko'); // Filled stars (active stars)

            // Count the number of filled stars
            const starCount = filledStars.length;

            // Ensure the star rating is between 1 and 5
            if (starCount >= 1 && starCount <= 5) {
                starRatings.push(starCount); // Add the star rating to the array
            }
        }); 

    } else if (isFlipkart) { // YUNG count nalang 
        // Scrape reviews for Flipkart
        const reviewNodes = document.querySelectorAll('.ZmyHeo');
        reviewNodes.forEach(node => {
            reviews.push(node.innerText.trim());
        });

        // Scrape rating count (e.g., "4.1 out of 5") and extract only the rating
        // Scrape count for Flipkart
        const countNode = document.querySelector('.ipqd2A');
        if (countNode) {
            count = countNode.innerText.trim();
        }
        
        // Scrape percentages for Lazada
        const percentageNodes = document.querySelectorAll('.BArk-j');
        percentageNodes.forEach(node => {
            percentages.push(node.innerText.trim());
        });

        // Scrape total number of global ratings
        const totalReviewsNode = document.querySelector('.row.j-aW8Z');
        if (totalReviewsNode) {
            totalReviews = totalReviewsNode.innerText.trim().replace('&', '').trim(); // Remove the '&' and store the total reviews
        }


        // Scrape star ratings
        const starNodes = document.querySelectorAll('.XQDdHH.Ga3i8K'); // Select containers with star ratings

        starNodes.forEach(node => {
            const starRatingText = node.innerText.trim(); // Extracts the star rating as text, e.g., "4"
            
            const starRating = parseInt(starRatingText, 10); // Convert text to an integer

            // Ensure the star rating is between 1 and 5
            if (starRating >= 1 && starRating <= 5) {
                starRatings.push(starRating); // Add the star rating to the array
            }
        });

        // Convert star ratings to star symbols
        starSymbols = starRatings.map(count => '★'.repeat(count) + '☆'.repeat(5 - count));

    } else if (isTemu) { // Goods na goods na
        // Scrape reviews for Temu
        const reviewNodes = document.querySelectorAll('._2EO0yd2j');
        const uniqueReviews = new Set(); // Use a Set to ensure uniqueness

        reviewNodes.forEach((node, index) => {
            if (index >= 4) { // Start from the 5th review (index 4)
                const reviewText = node.innerText.trim();
                
                // Add to the set only if it's not already present
                if (!uniqueReviews.has(reviewText)) {
                    uniqueReviews.add(reviewText);
                    reviews.push(reviewText); // Add to reviews array
                }
            }
        });
        
        // Scrape count for Temu
        const countNode = document.querySelector('._377jlZDR');
        if (countNode) {
            count = countNode.innerText.trim();
        }    

        const totalReviewsNode = document.querySelector('.pkFBdEpJ'); 
        if (totalReviewsNode) {
            totalReviews = totalReviewsNode.innerText.trim();
        }   

        // Select all elements that have the star rating in the aria-label attribute
        const starNodes = document.querySelectorAll('div[aria-label$="star rating"]');

        // Loop through starNodes and skip the first 4
        starNodes.forEach((node, index) => {
            if (index >= 4) { // Start after the first 4 elements
                const ariaLabel = node.getAttribute('aria-label'); // Get the aria-label value
                const starMatch = ariaLabel.match(/(\d+) star/); // Match the number before "star"
                
                if (starMatch) {
                    const starRating = parseInt(starMatch[1], 10); // Convert matched rating to an integer
                    if (starRating >= 1 && starRating <= 5) {
                        starRatings.push(starRating); // Add the star rating to your array
                    }
                }
            }
        });

        // Convert star ratings to star symbols (full stars + empty stars)
        const starSymbols = starRatings.map(count => '★'.repeat(count) + '☆'.repeat(5 - count));

    } else { // Lazada Goods na
        // Scrape reviews for Shopee
        const reviewNodes = document.querySelectorAll('.item-content');
        reviewNodes.forEach(node => {
            let reviewText = node.innerText.trim();
            
            // Check if the review contains "seller response" and filter out text containing the word "color"
            if (!reviewText.toLowerCase().includes("seller response")) {
                reviewText = reviewText.split(/Color:|Color Family/i)[0].trim(); // Split at "Color:" or "Color Family"
                
                reviews.push(reviewText);
            }
        });

        // Scrape percentages for Lazada
        const percentageNodes = document.querySelectorAll('span.percent');
        percentageNodes.forEach(node => {
            percentages.push(node.innerText.trim());
        });

        // Scrape count for Lazada
        const countNode = document.querySelector('.score-average');
        if (countNode) {
            count = countNode.innerText.trim();
        }

        const totalReviewsNode = document.querySelector('div.count'); // Replace with actual selector
        if (totalReviewsNode) {
            totalReviews = totalReviewsNode.innerText.trim(); // Store the total reviews
        }
    }

        // Scrape star ratings for Lazada
        const starContainers = document.querySelectorAll('.container-star.starCtn.left'); // Select the containers that hold the stars

        starContainers.forEach(container => {
        const stars = container.querySelectorAll('img.star'); // Select all star images within the container
            let starCount = 0; // Initialize count for filled stars
   
            stars.forEach(star => {
                const src = star.getAttribute('src'); // Get the source of the star image

               // Check if the star image is filled or empty
               if (src.includes('TB19Z')) {
                   // This is a filled star
                   starCount++; // Increment count for filled stars
               }
           });

           // Push the total star count for this review into the starRatings array
           starRatings.push(starCount);
       });
     
       // Convert star ratings to star symbols
       starSymbols = starRatings.map(count => '&starf;'.repeat(count) + '&star;'.repeat(5 - count));

    return { reviews: reviews, percentages: percentages, count: count,  totalReviews: totalReviews, starRatings: starSymbols  };
}

let accumulatedReviews = []; // Store all scraped reviews

// Function to control the loading spinner visibility
function toggleLoader(show) {
    const loader = document.getElementById('loader');
    loader.style.display = show ? 'block' : 'none';
}

// Function to send reviews to the backend and update the UI
function sendReviewsToBackend(reviews, starRatings) {
    fetch("http://127.0.0.1:5000/api/get_reviews", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ reviews: reviews, starRatings: starRatings })
    })
        .then(response => response.json())
        .then(data => {
            console.log("Data received from backend:", data);

        // Append new reviews to the global accumulated reviews
        accumulatedReviews = accumulatedReviews.concat(data.reviews);            

        // Update UI components
        updateUI(data.reviews, data.sentiment_counts, allPercentages, data.pros, data.cons);     

        })
        .catch(error => {
            console.error("Error sending data to backend:", error);
        });
}

// Function to update the UI
function updateUI(reviews, sentiment_counts, percentages, pros, cons) {
    $('#review-list').empty(); // Clear existing reviews

    if (!Array.isArray(reviews) || reviews.length === 0) {
        console.log("No reviews to display.");
        toggleLoader(true); // Hide loader if no reviews
        return; 
    }

    reviews.forEach((review, index) => {
        const starRatings = review.star_rating || "No Rating";

        // Determine the image source based on sentiment
        let imgSrc;
        switch (review.sentiment) {
            case 'Positive':
                imgSrc = 'icons/Icon_green.jpg';
                break;
            case 'Neutral':
                imgSrc = 'icons/Icon_yellow.jpg';
                break;
            case 'Negative':
                imgSrc = 'icons/Icon_red.jpg';
                break;
            default:
                imgSrc = 'icons/Icon_green.jpg';
        }

        // Check if the review summary is "No Summary"
        const hasSummary = review.summary !== "No summary";

        // Insert the review data into the HTML
        document.getElementById('review-list').insertAdjacentHTML('beforeend', `
            <li class="column">
                <img class="satisfaction_img" src="${imgSrc}" alt="Sentiment Icon"> <br>
                <strong class="number_rev">Review #${index + 1}</strong>
                <br><br><br>
                <span>${starRatings}</span> <br>
                <p class="reviews">${review.original}</p>
                <p class="sentiment">Sentiment: <strong>${review.sentiment}</strong></p>
                ${hasSummary ? `<button class="toggle-btn">Show Summary</button>` : ''}
                <p class="original-review" style="display: none;">${review.summary}</p>
            </li>
        `);
    });

    // Hide loader after displaying reviews
    toggleLoader(false);    

    // Add event listener for toggle buttons
    $('.toggle-btn').click(function () {
        $(this).siblings('.original-review').toggle(); // Toggle the visibility of the original review
        $(this).text($(this).text() === "Show Summary" ? "Hide Summary" : "Show Summary");
    });



    // Call the function to update progress bars and percentages
    displayPercentages(percentages);

    $('#percentages').text(allPercentages.join(', '));  // Display percentages
    $('#count').html(`${countValue} &starf;`);  // Display count
    $('#total').text(totalReviews);  // Display total number of reviews

    // 5 star rating dynamic based on Count
    document.querySelector('.inner-star').style.width = (countValue / 5) * 100 + "%";

    updateProgressBars(percentages);

    // Update the pie chart with sentiment counts
    updatePieChart(sentiment_counts); // PIE CHART
    displayProsCons(pros, cons) // PROS AND CONS

    // 1x download only
    $('#save-reviews-btn').off('click').on('click', () => {
        saveReviewsToCSV(reviews);
    });

    // download event to CSV download button
    document.getElementById('save-reviews-btn').addEventListener('click', () => saveReviewsToCSV(accumulatedReviews));
}   

// Function to display pros and cons
function displayProsCons(pros, cons) {
    const prosContainer = document.getElementById('pros-list');
    const consContainer = document.getElementById('cons-list');

    prosContainer.innerHTML = '';  // Clear existing pros
    consContainer.innerHTML = '';  // Clear existing cons

    // Insert pros and cons into the list
    pros.forEach(pro => prosContainer.insertAdjacentHTML('beforeend', `<li>${pro}</li>`));
    cons.forEach(con => consContainer.insertAdjacentHTML('beforeend', `<li>${con}</li>`));
}

// Declare the pie chart globally so it can be accessed in updatePieChart
let pie_chart;

// Function to update the pie chart with sentiment counts
function updatePieChart(sentiment_counts) {
    if (!sentiment_counts) {
        sentiment_counts = { positive: 0, negative: 0, neutral: 0 }; // Default to zero if not provided
    }

    // Ensure the pie chart is initialized before trying to update it
    if (pie_chart) {
        pie_chart.data.datasets[0].data = [
            sentiment_counts.positive || 0,
            sentiment_counts.negative || 0,
            sentiment_counts.neutral || 0,
        ];
        pie_chart.update();
    }
}

// Initialize the pie chart when the page is ready
document.addEventListener("DOMContentLoaded", function () {
    const pieChartContainer = document.getElementById("pie_chart");
    const ctx = pieChartContainer.getContext("2d");

    // Initialize the pie chart
    pie_chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ["Positive", "Negative", "Neutral"],
            datasets: [{
                data: [0, 0, 0], // Initial data set to zero
                backgroundColor: ['green', 'red', 'gold'],
                hoverOffset: 7
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        font: {
                            size: 12,
                        }
                    },
                    position: 'top',
                }
            }
        },
    });
});

// Function to display percentages in the HTML
function displayPercentages(percentages) {
    const ratingTotals = document.querySelectorAll('.rating-total');

    // Ensure we have the same amount of rating elements as percentages
    for (let i = 0; i < ratingTotals.length; i++) {
        if (i < percentages.length) {
            ratingTotals[i].setAttribute('data-rating-count', percentages[i]);
            ratingTotals[i].innerText = percentages[i];
        }
    }
}

// Function to update progress bars based on percentages
function updateProgressBars(percentages) {
    const barClasses = ['bar-5-star', 'bar-4-star', 'bar-3-star', 'bar-2-star', 'bar-1-star'];

    const numericPercentages = percentages.map(percentage => parseFloat(percentage.replace(/,/g, '').replace(/\+/g, '')) || 0);
    const totalRatings = numericPercentages.reduce((sum, value) => sum + value, 0);

    numericPercentages.forEach((percentage, index) => {
        if (barClasses[index]) {
            const bar = document.querySelector(`.${barClasses[index]}`);
            if (bar && totalRatings > 0) {
                const normalizedWidth = (percentage / totalRatings) * 100;
                bar.style.width = `${normalizedWidth}%`;
            }
        }
    });
}

let sentReviews = new Set(); // Initialize a Set to track exported reviews

// Function to get the current page URL from the active tab
function getPageURL() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                resolve(tabs[0].url); // Get the URL of the active tab
            } else {
                reject('No active tab found');
            }
        });
    });
}

// Function to save reviews to a CSV file
function saveReviewsToCSV(reviews) {
    getPageURL().then((currentPageURL) => {
        const header = "Review Number,Original,Summary,Sentiment,Star Rating,Review URL,Page URL\n";

        const rows = reviews
            .map((review, index) => {
                const reviewURL = review.url || currentPageURL; // Get the review-specific URL or fallback to the page URL if not available
                const uniqueKey = `${review.original}||${reviewURL}`; // Unique identifier for deduplication

                if (sentReviews.has(uniqueKey)) {
                    return null; // Skip already exported reviews
                }

                sentReviews.add(uniqueKey); // Track this review as exported

                const reviewNumber = `Review #${sentReviews.size}`; // Number reviews sequentially
                const starRatingNumeric = convertStarSymbolsToNumber(review.star_rating || ""); // Convert star symbols to a numeric rating

                return [
                    `"${reviewNumber}"`,
                    `"${review.original.replace(/"/g, '""')}"`,
                    `"${review.summary ? review.summary.replace(/"/g, '""') : 'No summary'}"`,
                    `"${review.sentiment || 'No Sentiment'}"`,
                    `${starRatingNumeric}`,
                    `"${reviewURL}"`, // Review-specific URL
                    `"${currentPageURL}"` // Main page URL
                ].join(",");
            })
            .filter(row => row !== null) // Remove skipped reviews
            .join("\n");

        const bom = '\uFEFF'; // UTF-8 BOM for emoji support
        const content = bom + header + rows;
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'reviews.csv';
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);
    }).catch((error) => {
        console.error("Error getting page URL: ", error);
    });
}

// Convert star symbols like "&starf;&star;&star;&star;" to numeric ratings (e.g., 5 or 4)
function convertStarSymbolsToNumber(starSymbols) {
    return (starSymbols.match(/&starf;/g) || []).length;
}

// Example usage: Attach event listener to the download button
document.getElementById('save-reviews-btn').addEventListener('click', () => {
    saveReviewsToCSV(allReviews);
});

// Convert star symbols like "&starf;&starf;&starf;&starf;&star;" to numeric ratings (e.g., 5 or 4)
function convertStarSymbolsToNumber(starSymbols) {
    if (!starSymbols) return 0; // Handle empty or undefined input

    // Count occurrences of full stars (&starf;)
    const fullStarCount = (starSymbols.match(/&starf;/g) || []).length;

    return fullStarCount;
}


// Return to top
document.addEventListener('DOMContentLoaded', () => {
    // Get the back-to-top button
    const backToTopButton = document.getElementById('back-to-top');

    // Show the button when the user scrolls down
    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) { // Show button if user scrolls down 200px
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    // Scroll to the top of the page when the button is clicked
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Smooth scrolling
        });
    });
});
