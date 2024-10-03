// window.Wized = window.Wized || [];
// window.Wized.push(async (Wized) => {

//     // Wait for the 'Load_Reset_Password' request to complete
//     const result = await Wized.requests.waitFor('Load_Reset_Password');

//     // Now that the request is done, collect the input values
//     const passwordInput1 = Wized.elements.get('ResetPassword_1'); // New password input
//     const currentPasswordInput = result.data.user[0].Password; // Current password from request result
//     const emailInput = result.data.user[0].Email;
//     const firstNameInput = result.data.user[0].First_Name;
//     const lastNameInput = result.data.user[0].Last_Name;

//     const charactersMin = document.querySelector('#charactersMin');
//     const containsSymbol = document.querySelector('#containsSymbol');
//     const cantContain = document.querySelector('#cantContain');
//     const newPassCheck = document.querySelector('#newPass'); // New SVG area for new password validation

//     // Function to return the SVG with specified fill color and symbol type
//     function getSVG(fillColor, isValid = false) {
//         if (isValid) {
//             return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
//                         <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
//                         <path d="M4.5 8L6.5 10L10.5 5" stroke="white" stroke-width="2" fill="none"/>
//                     </svg>`;
//         } else {
//             return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
//                         <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
//                         <line x1="5" y1="5" x2="10" y2="10" stroke="white" stroke-width="2"/>
//                         <line x1="5" y2="5" x2="10" y1="10" stroke="white" stroke-width="2"/>
//                     </svg>`;
//         }
//     }

//     // Initialize SVGs with default grey color
//     function initializeSVGs() {
//         charactersMin.innerHTML = getSVG("#d4d4d4");
//         containsSymbol.innerHTML = getSVG("#d4d4d4");
//         cantContain.innerHTML = getSVG("#d4d4d4");
//         newPassCheck.innerHTML = getSVG("#d4d4d4"); // Initialize new password check SVG
//     }

//     initializeSVGs(); // Set default SVGs on load

//     function normalizeString(str) {
//         return str.replace(/[\W_]+/g, '').toLowerCase();
//     }

//     function validatePassword() {
//         const password = passwordInput1.node.value; // Get new password value
//         const currentPassword = currentPasswordInput; // Current password from Wized data
//         const firstName = normalizeString(firstNameInput);
//         const lastName = normalizeString(lastNameInput);
//         const emailLocalPart = normalizeString(emailInput.split('@')[0]);

//         // Minimum 8 characters check
//         charactersMin.innerHTML = password.length >= 8 ? getSVG("#00ff00", true) : getSVG("#ff0000");

//         // Check for symbol or number
//         const symbolRegex = /[0-9!@#$%^&*(),.?":{}|<>]/;
//         containsSymbol.innerHTML = symbolRegex.test(password) ? getSVG("#00ff00", true) : getSVG("#ff0000");

//         // Check for disallowed substrings (firstName, lastName, emailLocalPart)
//         let disallowed = [firstName, lastName, emailLocalPart].filter(Boolean);
//         const containsDisallowed = disallowed.length > 0 && disallowed.some(part => password.includes(part));
//         cantContain.innerHTML = !containsDisallowed && password.length > 0 ? getSVG("#00ff00", true) : getSVG("#ff0000");

//         // Check if the new password matches the current password
//         if (password === currentPassword) {
//             newPassCheck.innerHTML = getSVG("#ff0000"); // Red if new password matches current password
//         } else {
//             newPassCheck.innerHTML = getSVG("#00ff00", true); // Green if the new password is unique
//         }
//     }

//     // Handle password field events to set current validation state
//     passwordInput1.node.addEventListener('focus', validatePassword);
//     passwordInput1.node.addEventListener('input', validatePassword);




// });



window.Wized = window.Wized || [];
window.Wized.push(async (Wized) => {
    const result = await Wized.requests.waitFor('Load_Reset_Password');
    const passwordInput1 = Wized.elements.get('ResetPassword_1');
    const passwordInput2 = Wized.elements.get('ResetPassword_2');
    const currentPasswordInput = result.data.user[0].Password;
    const emailInput = result.data.user[0].Email;
    const firstNameInput = result.data.user[0].First_Name;
    const lastNameInput = result.data.user[0].Last_Name;

    const charactersMin = document.querySelector('#charactersMin');
    const containsSymbol = document.querySelector('#containsSymbol');
    const cantContain = document.querySelector('#cantContain');
    const newPassCheck = document.querySelector('#newPass');
    const resetPasswordButton = document.getElementById('resetPasswordButton');

    function getSVG(fillColor, isValid = false) {
        return isValid
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                 <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
                 <path d="M4.5 8L6.5 10L10.5 5" stroke="white" stroke-width="2" fill="none"/>
               </svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                 <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
                 <line x1="5" y1="5" x2="10" y2="10" stroke="white" stroke-width="2"/>
                 <line x1="5" y2="5" x2="10" y1="10" stroke="white" stroke-width="2"/>
               </svg>`;
    }

    function initializeSVGs() {
        charactersMin.innerHTML = getSVG("#d4d4d4");
        containsSymbol.innerHTML = getSVG("#d4d4d4");
        cantContain.innerHTML = getSVG("#d4d4d4");
        newPassCheck.innerHTML = getSVG("#d4d4d4");
    }

    initializeSVGs();

    function normalizeString(str) {
        return str.replace(/[\W_]+/g, '').toLowerCase();
    }

    function validatePassword() {
        const password = passwordInput1.node.value;
        const currentPassword = currentPasswordInput;
        const firstName = normalizeString(firstNameInput);
        const lastName = normalizeString(lastNameInput);
        const emailLocalPart = normalizeString(emailInput.split('@')[0]);

        charactersMin.innerHTML = password.length >= 8 ? getSVG("#00ff00", true) : getSVG("#ff0000");
        const symbolRegex = /[0-9!@#$%^&*(),.?":{}|<>]/;
        containsSymbol.innerHTML = symbolRegex.test(password) ? getSVG("#00ff00", true) : getSVG("#ff0000");

        const disallowed = [firstName, lastName, emailLocalPart].filter(Boolean);
        const containsDisallowed = disallowed.length > 0 && disallowed.some(part => password.includes(part));
        cantContain.innerHTML = !containsDisallowed && password.length > 0 ? getSVG("#00ff00", true) : getSVG("#ff0000");

        if (password === currentPassword) {
            newPassCheck.innerHTML = getSVG("#ff0000");
        } else {
            newPassCheck.innerHTML = getSVG("#00ff00", true);
        }

        const isValid = password.length >= 8 &&
            symbolRegex.test(password) &&
            !containsDisallowed &&
            password !== currentPassword &&
            (passwordInput1.node.value === passwordInput2.node.value);

        if (isValid) {
            resetPasswordButton.classList.add('valid');
            resetPasswordButton.disabled = false; // Enable the button
        } else {
            resetPasswordButton.classList.remove('valid');
            resetPasswordButton.disabled = true; // Disable the button when not valid
        }
    }

    passwordInput1.node.addEventListener('focus', validatePassword);
    passwordInput1.node.addEventListener('input', validatePassword);
    passwordInput2.node.addEventListener('focus', validatePassword);
    passwordInput2.node.addEventListener('input', validatePassword);
});
