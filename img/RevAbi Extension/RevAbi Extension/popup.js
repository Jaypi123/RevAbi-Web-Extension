document.getElementById('filterBtn').addEventListener('click', () => {
  chrome.windows.create({
    url: 'filter.html',
    type: 'popup',
    width: 800,
    height: 600
  });
});
