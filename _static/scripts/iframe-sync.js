document.addEventListener("DOMContentLoaded", function () {
    const iframe = document.querySelector("iframe");
    const toggleButton = document.querySelector(".theme-switch-button");

    // Initialize theme and mode (sync them)
    let theme = localStorage.getItem("theme") || "light"; // Default to "light"
    if (theme !== "light" && theme !== "dark") {
        theme = "light"; // Fallback if an invalid value is found
    }
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-mode", theme); // Sync mode with theme

    // Update both theme and mode in localStorage
    localStorage.setItem("theme", theme);
    localStorage.setItem("mode", theme);

    if (iframe) {
        iframe.addEventListener("load", function () {
            // Pass the initial theme/mode to the iframe after it loads
            iframe.contentWindow.postMessage({ theme: theme, mode: theme }, "*");
        });
    }

    if (toggleButton) {
        toggleButton.addEventListener("click", function () {
            // Toggle between light and dark
            theme = theme === "light" ? "dark" : "light";

            // Update theme and mode attributes
            document.documentElement.setAttribute("data-theme", theme);
            document.documentElement.setAttribute("data-mode", theme);

            // Update localStorage for both theme and mode
            localStorage.setItem("theme", theme);
            localStorage.setItem("mode", theme);

            // Pass the new theme/mode to the iframe
            if (iframe) {
                iframe.contentWindow.postMessage({ theme: theme, mode: theme }, "*");
            }
        });
    }

    // Debugging logs
    console.log("Initial theme:", theme);
});
