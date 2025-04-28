chrome.runtime.onMessage.addListener(data => {
	switch (data.event) {
		case 'onStart':
			console.log("you want more reviews")
			break;
		case 'onStop':
			console.log("you clicked settings")
			break;
		default:
			break;
	}
})

