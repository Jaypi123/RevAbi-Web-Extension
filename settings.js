// For settings
$(document).ready(function() {
    const $textSizeRange = $('#text-size');
    const $reviewList = $('#review-list');
    const $themeSelect = $('#theme');

    // Function to update text size based on range input value
    function updateTextSize() {
        const newSize = $textSizeRange.val();
        console.log(`Updating text size to: ${newSize}px`);
        $reviewList.find('.reviews, .original-review').css('font-size', `${newSize}px`); // .sentiment add ko sa susunod ( to change text size)
    }

    // Initial call to set text size
    updateTextSize();

    // Event listener for range input change
    $textSizeRange.on('input', updateTextSize);

    // Event listener for layout change
    $('#layout').on('change', function() {
        const $reviewListContainer = $('.review-list');
        if (this.value === 'stack') {
            $reviewListContainer.addClass('stack');
        } else {
            $reviewListContainer.removeClass('stack');
        }
    });

        // Get URL from query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const reviewUrl = urlParams.get('url');
   
        if (reviewUrl) {
            $skeletonLoader.show();
            fetchReviews(reviewUrl); // Fetch initial reviews
        }
   
        // Dark mode toggle
        $themeSelect.on('change', function() {
            $('body').toggleClass('dark-mode', this.value === 'dark');
        });
   
        // Event delegation for dynamically added toggle buttons
        $reviewList.on('click', '.toggle-btn', function() {
            $(this).siblings('.original').toggleClass('hidden');
        });
    });