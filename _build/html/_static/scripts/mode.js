document.addEventListener("DOMContentLoaded", function () {
    // Override the auto mode handling in pydata-sphinx-theme
    const allowedModes = ["light", "dark"]; // Define allowed modes

    // Ensure localStorage only has valid themes
    const cleanMode = () => {
        let mode = localStorage.getItem("mode") || "light";
        if (!allowedModes.includes(mode)) {
            mode = "light"; // Fallback to light if invalid mode found
            localStorage.setItem("mode", mode);
        }
        return mode;
    };

    // Enforce a valid mode on the <html> element
    const enforceValidMode = () => {
        const mode = document.documentElement.dataset.mode || "light";
        if (!allowedModes.includes(mode)) {
            const validMode = cleanMode();
            document.documentElement.setAttribute("data-mode", validMode);
            document.documentElement.setAttribute("data-theme", validMode);
            console.log(`[Patch]: Enforced mode to '${validMode}'`);
        }
    };

    // Observe changes to the <html> element's attributes
    const observer = new MutationObserver(() => enforceValidMode());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });

    // Set initial mode if not valid
    enforceValidMode();

    // Listen to theme-switching logic
    document.querySelectorAll(".theme-switch-button").forEach(button => {
        button.addEventListener("click", () => {
            const currentMode = document.documentElement.dataset.mode || "light";
            const newMode = currentMode === "light" ? "dark" : "light";
            localStorage.setItem("mode", newMode);
            document.documentElement.setAttribute("data-mode", newMode);
            document.documentElement.setAttribute("data-theme", newMode);
            console.log(`[Patch]: Switched mode to '${newMode}'`);
        });
    });

    console.log("[Patch]: Mode enforcement script loaded.");
});
