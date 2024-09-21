function validatePassword() {
    const password = passwordInput.node.value; // Remove normalizeString here
    const firstName = normalizeString(firstNameInput.node.value);
    const lastName = normalizeString(lastNameInput.node.value);
    const emailLocalPart = normalizeString(emailInput.node.value.split('@')[0]);

    // Minimum 8 characters check
    charactersMin.innerHTML = password.length >= 8 ? getSVG("#00ff00", true) : getSVG("#ff0000");

    // Check for symbol or number
    const symbolRegex = /[0-9!@#$%^&*(),.?":{}|<>]/;
    containsSymbol.innerHTML = symbolRegex.test(password) ? getSVG("#00ff00", true) : getSVG("#ff0000");

    // Check for disallowed substrings (firstName, lastName, emailLocalPart)
    let disallowed = [firstName, lastName, emailLocalPart].filter(Boolean);
    const containsDisallowed = disallowed.length > 0 && disallowed.some(part => password.includes(part));
    cantContain.innerHTML = !containsDisallowed && password.length > 0 ? getSVG("#00ff00", true) : getSVG("#ff0000");
}


// Handle password field events to set current validation state
passwordInput.node.addEventListener('focus', validatePassword);
passwordInput.node.addEventListener('input', validatePassword);

