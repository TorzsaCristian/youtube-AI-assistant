(function () {
    // Try to insert the chat plugin after the page has loaded
    window.addEventListener('load', window.insertChatPlugin);

    // Retry inserting the chat plugin when the URL changes (for example, when navigating between videos)
    window.addEventListener('yt-navigate-finish', window.insertChatPlugin);
})();


