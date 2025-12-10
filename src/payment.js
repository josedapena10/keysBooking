// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@/mirrorclick.js';
document.body.appendChild(script);



// for no scroll background when modal is open
// when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // on .open-modal click
    document.querySelectorAll('.open-modal').forEach(trigger => {
        trigger.addEventListener('click', function () {
            // on every click
            document.querySelectorAll('body').forEach(target => target.classList.add('no-scroll'));
        });
    });

    // on .close-modal click
    document.querySelectorAll('.close-modal').forEach(trigger => {
        trigger.addEventListener('click', function () {
            // on every click
            document.querySelectorAll('body').forEach(target => target.classList.remove('no-scroll'));
        });
    });
});







(async function () {
    try {
        const profileButton = document.querySelector('[data-element="profile_button"]');
        const profileButtonDropdown = document.querySelector('[data-element="profile_button_dropdown"]');
        let isPopupOpen = false;

        // Close the dropdown initially
        profileButtonDropdown.style.display = 'none';

        // Function to toggle the dropdown
        const togglePopup = () => {
            isPopupOpen = !isPopupOpen;
            profileButtonDropdown.style.display = isPopupOpen ? 'flex' : 'none';
        };

        // Event listener for profile button click and toggling the dropdown
        profileButton.addEventListener('click', function () {
            togglePopup();
        });

        // Event listener for body click to close the dropdown
        document.body.addEventListener('click', function (evt) {
            if (!profileButton.contains(evt.target) && !profileButtonDropdown.contains(evt.target)) {
                isPopupOpen = false;
                profileButtonDropdown.style.display = 'none';
            }
        });

        // Event listeners to close the popup when buttons inside are clicked
        const popupButtons = profileButtonDropdown.querySelectorAll('[data-element*="Button"]');
        popupButtons.forEach(button => {
            button.addEventListener('click', function () {
                isPopupOpen = false;
                profileButtonDropdown.style.display = 'none';
            });
        });

    } catch (err) {
    }
})();








window.Wized = window.Wized || [];
window.Wized.push((Wized) => {


    const passwordInput = Wized.elements.get('SignUp_Password');
    const emailInput = Wized.elements.get('SignUp_Email');
    const firstNameInput = Wized.elements.get('SignUp_FirstName');
    const lastNameInput = Wized.elements.get('SignUp_LastName');
    const phoneNumberInput = Wized.elements.get('SignUp_PhoneNumber');
    //const birthdateInput = Wized.elements.get('SignUp_BirthDate');























    // Function to capitalize the first letter of a string
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    // Event listener for when the user leaves the first name input field
    firstNameInput.node.addEventListener('blur', (event) => {
        const inputElement = event.target;
        inputElement.value = capitalizeFirstLetter(inputElement.value);
    });

    // Event listener for when the user leaves the last name input field
    lastNameInput.node.addEventListener('blur', (event) => {
        const inputElement = event.target;
        inputElement.value = capitalizeFirstLetter(inputElement.value);
    });

















    phoneNumberInput.node.addEventListener('focus', (event) => {
        const inputElement = event.target;
        if (inputElement.value === '') {
            inputElement.value = '';  // Clear the field when focused if empty
        }
    });

    phoneNumberInput.node.addEventListener('input', handlePhoneNumberInput);
    phoneNumberInput.node.addEventListener('keydown', handlePhoneKeyDown);
    phoneNumberInput.node.addEventListener('change', handlePhoneNumberInput);

    function handlePhoneNumberInput(event) {
        const inputElement = event.target;
        let input = inputElement.value.replace(/[\D-]/g, ''); // Strip non-numeric characters and hyphens
        if (input.length > 10) {
            input = input.substr(0, 10); // Limit to 10 digits
        }

        // Formatting the phone number as the user types
        let formattedNumber = formatPhoneNumber(input);
        inputElement.value = formattedNumber; // Update the field with formatted input
    }

    function handlePhoneKeyDown(event) {
        const key = event.key;
        const inputElement = event.target;

        // Allow control keys such as backspace, tab, enter, etc.
        if (key.length === 1 && !/[0-9]/.test(key)) {
            event.preventDefault(); // Prevent default action for non-numeric keys
        }

        // Prevent input if the current length of digits is 10 or more
        const currentInput = inputElement.value.replace(/[\D-]/g, '');
        if (currentInput.length >= 10 && /[0-9]/.test(key)) {
            event.preventDefault();
        }
    }

    function formatPhoneNumber(input) {
        let formattedNumber = input;
        if (input.length > 2) {
            formattedNumber = input.substr(0, 3) + (input.length > 3 ? '-' : '') + input.substr(3);
        }
        if (input.length > 5) {
            formattedNumber = input.substr(0, 3) + '-' + input.substr(3, 3) + (input.length > 6 ? '-' : '') + input.substr(6);
        }
        return formattedNumber;
    }

























    // // Event listener for focusing on the input field
    // birthdateInput.node.addEventListener('focus', (event) => {
    //     const inputElement = event.target;
    //     if (!inputElement.value.trim()) {
    //         inputElement.value = 'mm/dd/yyyy'; // Set initial placeholder text
    //         highlightText(inputElement, 0, 2); // Highlight 'mm' initially
    //     }
    // });

    // // Function to highlight text within the input
    // function highlightText(inputElement, start, end) {
    //     setTimeout(() => {
    //         inputElement.setSelectionRange(start, end);
    //     }, 10);
    // }

















    const charactersMin = document.querySelector('#charactersMin');
    const containsSymbol = document.querySelector('#containsSymbol');
    const cantContain = document.querySelector('#cantContain');

    // Function to return the SVG with specified fill color and symbol type
    function getSVG(fillColor, isValid = false) {
        if (isValid) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                        <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
                        <path d="M4.5 8L6.5 10L10.5 5" stroke="white" stroke-width="2" fill="none"/>
                    </svg>`;
        } else {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                        <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
                        <line x1="5" y1="5" x2="10" y2="10" stroke="white" stroke-width="2"/>
                        <line x1="5" y2="5" x2="10" y1="10" stroke="white" stroke-width="2"/>
                    </svg>`;
        }
    }

    // Initialize SVGs with default grey color
    function initializeSVGs() {
        charactersMin.innerHTML = getSVG("#d4d4d4");
        containsSymbol.innerHTML = getSVG("#d4d4d4");
        cantContain.innerHTML = getSVG("#d4d4d4");
    }

    initializeSVGs(); // Set default SVGs on load

    function normalizeString(str) {
        return str.replace(/[\W_]+/g, '').toLowerCase();
    }

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





    // Retrieve the WizedElement instance by its name
    const signUpButton = Wized.elements.get('SignUp_AgreeSubmitButton');

    // Ensure the element is present in the DOM
    if (signUpButton && signUpButton.node) {
        // Add click event listener to the button's DOM node
        signUpButton.node.addEventListener('click', function () {
            // Update the state in the Data Store to indicate the button was clicked
            Wized.data.v.signup_buttonclicked = true;
        });
    } else {
    }






    //forgot password
    //forgot password
    // Handle input rules for ForgotPassword_Email
    const forgotPasswordEmailInput = Wized.elements.get('ForgotPassword_Email');

    // Add validation logic for ForgotPassword_Email
    forgotPasswordEmailInput.node.addEventListener('focus', (event) => {
        const inputElement = event.target;
        if (inputElement.value === '') {
            inputElement.value = '';  // Clear the field when focused if empty
        }
    });

    forgotPasswordEmailInput.node.addEventListener('input', handleEmailInput);
    forgotPasswordEmailInput.node.addEventListener('keydown', handleEmailKeyDown);
    forgotPasswordEmailInput.node.addEventListener('change', handleEmailInput);

    // Function to handle email input
    function handleEmailInput(event) {
        const inputElement = event.target;
        let input = inputElement.value.replace(/[^a-zA-Z0-9@._-]/g, ''); // Strip invalid characters for email
        inputElement.value = input; // Update the field with sanitized input
    }

    // Function to handle email key down events
    function handleEmailKeyDown(event) {
        const key = event.key;
        const inputElement = event.target;

        // Prevent any characters that are not alphanumeric or standard email characters
        if (!/^[a-zA-Z0-9@._-]$/.test(key) && key.length === 1) {
            event.preventDefault(); // Prevent invalid characters
        }
    }


});




window.Wized = window.Wized || [];
window.Wized.push(async (Wized) => {

    const params = Wized.data.n?.parameter || {};

    // Only run truncation if boat or charter pages are active
    const shouldRunTruncate =
        params.boatId != null ||
        params.fishingCharterId1 != null;

    if (!shouldRunTruncate) return;

    // ----- Width-based truncation function -----
    function truncateToFit(selector) {
        const els = document.querySelectorAll(selector);

        els.forEach(el => {
            // Store or retrieve the original full text
            if (!el.dataset.fullText) {
                el.dataset.fullText = (el.textContent || "").trim();
            }
            const full = el.dataset.fullText;

            // Get parent container's width to use as the constraint
            const parent = el.parentElement;
            if (!parent) return;

            const parentWidth = parent.clientWidth;
            if (parentWidth <= 0) return;

            // Reset to full text first
            el.textContent = full;

            // Set styles to constrain within parent
            el.style.whiteSpace = "nowrap";
            el.style.overflow = "hidden";
            el.style.display = "block";
            el.style.maxWidth = "100%";

            // Create a temporary span to measure actual text width
            const measureSpan = document.createElement('span');
            measureSpan.style.visibility = 'hidden';
            measureSpan.style.position = 'absolute';
            measureSpan.style.whiteSpace = 'nowrap';
            measureSpan.style.font = window.getComputedStyle(el).font;
            document.body.appendChild(measureSpan);

            // Measure full text width
            measureSpan.textContent = full;
            const textWidth = measureSpan.offsetWidth;

            // If text is wider than parent, truncate character by character
            if (textWidth > parentWidth) {
                let truncated = full;

                while (truncated.length > 0) {
                    measureSpan.textContent = truncated + "…";
                    const currentWidth = measureSpan.offsetWidth;

                    if (currentWidth <= parentWidth) {
                        el.textContent = truncated + "…";
                        break;
                    }
                    truncated = truncated.slice(0, -1);
                }

                if (truncated.length === 0) {
                    el.textContent = "…";
                }
            }

            // Clean up measurement span
            document.body.removeChild(measureSpan);
        });
    }

    // Run after every Wized request completes (correct timing)
    Wized.on("requestend", () => {
        truncateToFit('[w-el="ListingTitle"]');
        truncateToFit('[w-el="ReservationExtrasCards_boatRental_name"]');
        truncateToFit('[w-el="ReservationExtrasCards_fishingCharter_name"]');
    });

    // Re-run on viewport changes
    window.addEventListener("resize", () => {
        truncateToFit('[w-el="ListingTitle"]');
        truncateToFit('[w-el="ReservationExtrasCards_boatRental_name"]');
        truncateToFit('[w-el="ReservationExtrasCards_fishingCharter_name"]');
    });
});




window.Wized = window.Wized || [];
window.Wized.push(async (Wized) => {
    await Wized.ready(); // DOM + Wized variables fully available

    // --- setup: hide errors before any click ---
    const errEl = document.querySelector(
        '[w-el="boatRentalAdditionalInfo_operatorInfoError"]'
    );
    if (errEl) {
        errEl.textContent = "";
        errEl.style.display = "none";
    }

    const btn = document.querySelector(
        '[w-el="boatRentalAdditionalInfo_submitButton"]'
    );

    // --- submit button pieces ---
    const submitTextEl = document.querySelector(
        '[w-el="boatRentalAdditionalInfo_submitButtonText"]'
    );
    const submitLoaderEl = document.querySelector(
        '[w-el="boatRentalAdditionalInfo_submitButtonLoader"]'
    );
    if (submitLoaderEl) submitLoaderEl.style.display = "none";

    // -------------------- YES / NO STATE --------------------
    let ownABoatValue = ""; // "yes" or "no"
    let operatedInKeysValue = ""; // "yes" or "no"

    // ----------------------- HELPERS -----------------------
    const getVal = (el) => {
        const node = document.querySelector(`[w-el="${el}"]`);
        if (!node) return "";

        if ("value" in node && node.value != null) return String(node.value).trim();
        const attr = node.getAttribute?.("value");
        if (attr) return attr.trim();
        const dv = node.dataset?.value;
        if (dv) return String(dv).trim();
        if (node.isContentEditable) return node.innerText.trim();
        return node.textContent?.trim() || "";
    };

    const setBorder = (el, isError, isValid) => {
        const node = document.querySelector(`[w-el="${el}"]`);
        if (!node) return;
        if (isError) node.style.borderColor = "red";
        else if (isValid) node.style.borderColor = "green";
        else node.style.borderColor = "yellow";
    };

    // Date helpers, ISO conversion, etc. — unchanged (KEEP your previous logic here)

    const isLeap = (y) =>
        (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const daysInMonth = (m, y) =>
        [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
        m - 1
        ] || 31;

    function parseDobMMDDYYYY(str) {
        const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
        if (!m) return { valid: false, iso: "" };
        const mm = parseInt(m[1], 10),
            dd = parseInt(m[2], 10),
            yyyy = parseInt(m[3], 10);
        if (mm < 1 || mm > 12) return { valid: false, iso: "" };
        const dim = daysInMonth(mm, yyyy);
        if (dd < 1 || dd > dim) return { valid: false, iso: "" };
        return {
            valid: true,
            iso: `${yyyy}-${String(mm).padStart(2, "0")}-${String(
                dd
            ).padStart(2, "0")}`,
        };
    }

    const __monthMap = {
        jan: 1,
        january: 1,
        feb: 2,
        february: 2,
        mar: 3,
        march: 3,
        apr: 4,
        april: 4,
        may: 5,
        jun: 6,
        june: 6,
        jul: 7,
        july: 7,
        aug: 8,
        august: 8,
        sep: 9,
        sept: 9,
        september: 9,
        oct: 10,
        october: 10,
        nov: 11,
        november: 11,
        dec: 12,
        december: 12,
    };

    const toISO = (raw) => {
        const s0 = (raw || "").trim();
        if (!s0) return "";
        const s = s0.replace(/,/g, "").replace(/(\d{1,2})(st|nd|rd|th)/gi, "$1");

        let m;

        if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s)))
            return `${m[1]}-${String(parseInt(m[2], 10)).padStart(
                2,
                "0"
            )}-${String(parseInt(m[3], 10)).padStart(2, "0")}`;

        if ((m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s)))
            return `${m[3]}-${String(parseInt(m[1], 10)).padStart(
                2,
                "0"
            )}-${String(parseInt(m[2], 10)).padStart(2, "0")}`;

        if ((m = /^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/.exec(s))) {
            const mm = __monthMap[m[1].toLowerCase()];
            if (mm)
                return `${m[3]}-${String(mm).padStart(2, "0")}-${String(
                    parseInt(m[2], 10)
                ).padStart(2, "0")}`;
        }

        const p = parseDobMMDDYYYY(s);
        return p.valid ? p.iso : "";
    };

    // ----------------------- VALIDATION -----------------------
    function validateAndRender() {
        const company =
            Wized.data.r.Load_BoatRental_Details?.data?._boat_company || {};
        const missing = [];

        const fullName = getVal("boatRentalAdditionalInfo_fullName");
        const birthDateISO = toISO(
            getVal("boatRentalAdditionalInfo_birthDate")
        );

        if (!fullName) missing.push("Full Name");
        if (!birthDateISO) missing.push("Birth Date");

        setBorder("boatRentalAdditionalInfo_fullName", !fullName, !!fullName);
        setBorder(
            "boatRentalAdditionalInfo_birthDate",
            !birthDateISO,
            !!birthDateISO
        );

        // Address required?
        if (company.requirements_homeAddress) {
            const addressFields = [
                ["boatRentalAdditionalInfo_streetAddress", "Street Address"],
                ["boatRentalAdditionalInfo_cityAddress", "City"],
                ["boatRentalAdditionalInfo_stateAddress", "State"],
                ["boatRentalAdditionalInfo_zipcodeAddress", "Zip Code"],
            ];

            addressFields.forEach(([id, label]) => {
                const miss = !getVal(id);
                if (miss) missing.push(label);
                setBorder(id, miss, !miss);
            });
        }

        // Experience
        if (company.requirements_experience) {
            const v = getVal("boatRentalAdditionalInfo_experience");
            if (!v) missing.push("Boating Experience");
            setBorder("boatRentalAdditionalInfo_experience", !v, !!v);
        }

        // DLN
        if (company.requirements_driversLicense) {
            const v = getVal("boatRentalAdditionalInfo_dln");
            if (!v) missing.push("Driver’s License Number");
            setBorder("boatRentalAdditionalInfo_dln", !v, !!v);
        }

        // Safety ID
        if (company.requirements_boaterSafetyId) {
            const isExempt =
                birthDateISO && birthDateISO < "1988-01-01";
            const v = getVal("boatRentalAdditionalInfo_safetyID");

            if (!isExempt && !v) missing.push("Boater Safety Education ID");
            setBorder(
                "boatRentalAdditionalInfo_safetyID",
                !v && !isExempt,
                !!v || isExempt
            );
        }

        // YES/NO required
        if (company.requirements_ownABoat && !ownABoatValue)
            missing.push("Own a Boat");
        if (company.requirements_operatedInKeys && !operatedInKeysValue)
            missing.push("Operated in the Keys");

        if (missing.length) {
            errEl.textContent = "Please complete: " + missing.join(", ");
            errEl.style.display = "flex";
        } else {
            errEl.textContent = "";
            errEl.style.display = "none";
        }

        return missing.length > 0;
    }

    // -------- INIT LIVE VALIDATION ----------
    function attachLiveValidationOnce() {
        if (window.__kbOpInfoLive) return;
        window.__kbOpInfoLive = true;

        const ids = [
            "boatRentalAdditionalInfo_fullName",
            "boatRentalAdditionalInfo_birthDate",
            "boatRentalAdditionalInfo_streetAddress",
            "boatRentalAdditionalInfo_cityAddress",
            "boatRentalAdditionalInfo_stateAddress",
            "boatRentalAdditionalInfo_zipcodeAddress",
            "boatRentalAdditionalInfo_experience",
            "boatRentalAdditionalInfo_dln",
            "boatRentalAdditionalInfo_safetyID",
        ];

        ids.forEach((id) => {
            const node = document.querySelector(`[w-el="${id}"]`);
            node?.addEventListener("input", validateAndRender);
            node?.addEventListener("change", validateAndRender);
        });
    }

    // ---------------- CLICKABLE YES/NO BLOCKS ----------------
    function setupSelectionBlocks() {
        const ownYes = document.querySelector(
            '[w-el="boatRentalAdditionalInfo_ownABoat_yesBlock"]'
        );
        const ownNo = document.querySelector(
            '[w-el="boatRentalAdditionalInfo_ownABoat_noBlock"]'
        );

        const opYes = document.querySelector(
            '[w-el="boatRentalAdditionalInfo_operatedInKeys_yesBlock"]'
        );
        const opNo = document.querySelector(
            '[w-el="boatRentalAdditionalInfo_operatedInKeys_noBlock"]'
        );

        const selectOption = (clicked, other, setter, val) => {
            clicked.classList.add("selected");
            other.classList.remove("selected");
            setter(val);
            validateAndRender();
        };

        // own a boat
        ownYes?.addEventListener("click", () =>
            selectOption(ownYes, ownNo, (v) => (ownABoatValue = "yes"), "yes")
        );
        ownNo?.addEventListener("click", () =>
            selectOption(ownNo, ownYes, (v) => (ownABoatValue = "no"), "no")
        );

        // operated in keys
        opYes?.addEventListener("click", () =>
            selectOption(opYes, opNo, (v) => (operatedInKeysValue = "yes"), "yes")
        );
        opNo?.addEventListener("click", () =>
            selectOption(opNo, opYes, (v) => (operatedInKeysValue = "no"), "no")
        );
    }

    setupSelectionBlocks();

    // ---------------- SUBMIT HANDLER ----------------
    btn?.addEventListener("click", () => {
        const company =
            Wized.data.r.Load_BoatRental_Details?.data?._boat_company || {};
        const minAge = company.minAge;

        const birthDateISO = toISO(
            getVal("boatRentalAdditionalInfo_birthDate")
        );

        if (minAge && birthDateISO) {
            const today = new Date();
            const bd = new Date(birthDateISO);
            let age = today.getFullYear() - bd.getFullYear();
            const m = today.getMonth() - bd.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;

            if (age < minAge) {
                errEl.textContent = `Unable to add to reservation: minimum age is ${minAge}.`;
                errEl.style.display = "flex";
                setBorder("boatRentalAdditionalInfo_birthDate", true, false);
                attachLiveValidationOnce();
                return;
            }
        }

        const hasError = validateAndRender();
        attachLiveValidationOnce();
        if (hasError) return;

        submitTextEl.style.display = "none";
        submitLoaderEl.style.display = "flex";
        btn.disabled = true;

        const fmtAddress = () => {
            const parts = [
                getVal("boatRentalAdditionalInfo_streetAddress"),
                getVal("boatRentalAdditionalInfo_aptAddress"),
                getVal("boatRentalAdditionalInfo_cityAddress"),
                getVal("boatRentalAdditionalInfo_stateAddress"),
                getVal("boatRentalAdditionalInfo_zipcodeAddress"),
            ].filter(Boolean);
            return parts.join(", ");
        };

        const payload = {
            user_id: Wized.data.r.Load_user?.data?.id ?? 0,
            name: getVal("boatRentalAdditionalInfo_fullName"),
            dateOfBirth: birthDateISO,
            address: fmtAddress(),
            boatingExperience: getVal("boatRentalAdditionalInfo_experience"),
            dln: getVal("boatRentalAdditionalInfo_dln"),
            boaterSafetyId: getVal("boatRentalAdditionalInfo_safetyID"),

            // YES/NO STRINGS
            ownABoat: ownABoatValue,
            operatedInKeys: operatedInKeysValue,
        };

        fetch(
            "https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/boat_additionalInfo",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        )
            .then(async (res) => {
                if (!res.ok) {
                    const msg = await res.text().catch(() => "");
                    throw new Error(msg || `Request failed with ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                const id = data?.id;
                if (!id) throw new Error("No id returned");

                const url = new URL(window.location.href);
                url.searchParams.set("boatAdditionalInfo", id);
                window.location.assign(url.toString());
            })
            .catch((err) => {
                errEl.textContent =
                    "We couldn't save your info right now. Please try again. " +
                    (err?.message ? `(${err.message})` : "");
                errEl.style.display = "flex";

                submitTextEl.style.display = "flex";
                submitLoaderEl.style.display = "none";
                btn.disabled = false;
            });
    });
});
