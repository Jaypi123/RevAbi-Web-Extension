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

// DYNAMIC STAR RATINGS SCOREBOARD
// apply user rating to all displays
// add star ratings to an array
var starRating = document.querySelectorAll(".fa-star"),
  ratingTotal = document.querySelectorAll(".rating-total");

// convert ratingTotal HTMLCollection to array and reverse its order (5 star <-> 1 star)
var reverseRatingTotal = Array.from(ratingTotal).reverse();

// display initial rating totals
displayTotals();

// use event listener to record changes to user rating
starRating.forEach(function(star) {
  star.addEventListener("click", recordRating);
})

function recordRating(event) {
  // use indexOf to identify selected user rating
  var userRating = Array.from(starRating).indexOf(event.target);

  // define selected rating to adjust display totals
  var selectedIndex;

  starRating.forEach(function(item, index) {
    // add or remove .active class based upon selected user rating
    if (index < userRating + 1) {
      starRating[index].classList.add("active");
      selectedIndex = index;
    } else {
      starRating[index].classList.remove("active");
    }

    displayTotals(selectedIndex);
  });
}

// display star rating totals from html custom data-
function displayTotals(selectedIndex) {
  var barChart = document.querySelectorAll(".bar"),
    displaySummary = document.querySelectorAll(".summary"),
    numRatings = 0,
    numRatingsValue = 0;

    // convert barChart HTMLCollection to array and reverse its order (5 star <-> 1 star)
    var reverseBarChart = Array.from(barChart).reverse();

    reverseRatingTotal.forEach(function(total, index) {
        if (index == selectedIndex) {
        // add selected rating to display total
        total.innerHTML = (parseInt(total.getAttribute("data-rating-count")) + 1);
        // adjust selected bar width
        reverseBarChart[index].style.width = (((parseInt(total.getAttribute("data-rating-count")) + 1) / 20) * 100) + "%";
        } else {
        // display unselected totals
        total.innerHTML = total.getAttribute("data-rating-count");
        // adjust unselected bar widths
        reverseBarChart[index].style.width = ((total.getAttribute("data-rating-count") / 20) * 100) + "%";
    }
    
    // count total number and value of ratings
    numRatings += parseInt(total.innerHTML);
    numRatingsValue += (parseInt(total.innerHTML) * (index + 1));
  });

/* NOT YET
    // display rating average and total
    ratingsAverage = (numRatingsValue / numRatings).toFixed(2);
    displaySummary[0].innerHTML = ratingsAverage + " average based on " + numRatings + " reviews.";
*/
}
