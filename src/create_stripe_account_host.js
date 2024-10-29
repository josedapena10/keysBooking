// import { loadConnectAndInitialize } from "@stripe/connect-js";

// document.addEventListener('DOMContentLoaded', () => {

//     function getCookieValue(name) {
//         const value = `; ${document.cookie}`;
//         const parts = value.split(`; ${name}=`);
//         if (parts.length === 2) return parts.pop().split(';').shift();
//         return null; // Return null if the cookie doesn't exist
//     }

//     async function createAccountSession(userID) {
//         try {

//             const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:FNhKS6jt/connect-create_account_session?user_id=${userID}`, {
//                 method: 'POST', // Assuming it's still a POST request
//                 headers: {
//                     'Content-Type': 'application/json'
//                 }
//                 // No need for a body, since userID is in the URL
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! Status: ${response.status}`);
//             }

//             const data = await response.json();
//             return data.result1.response.result.client_secret; // Assuming the response contains a client_secret field
//         } catch (error) {
//         }
//     }


//     const stripeConnectInstance = loadConnectAndInitialize({
//         // This is your test publishable API key.
//         publishableKey: "pk_test_51OsWQaBjoQQxZuTR7kxKM3PQ891E9I2EbUPpWANip2KMtR9VBvfgBLFTtpXH3XfDO1iFFBAuQ3EdjG6G2WyN4Sjf006Suh9NY6",
//         fetchClientSecret: () => createAccountSession(getCookieValue('uID')),
//     });


//     const accountOnboarding = stripeConnectInstance.create('account-onboarding');
//     accountOnboarding.setCollectionOptions({
//         fields: 'eventually_due',
//         futureRequirements: 'include',
//     })
//     accountOnboarding.setOnLoadError((loadError) => {
//         const componentName = loadError.elementTagName
//         const error = loadError.error
//     });

//     accountOnboarding.setOnExit(() => {
//     });
//     const container = document.getElementById('container');
//     if (container) {
//         container.appendChild(accountOnboarding);
//     } else {
//     }


//     async function createAccountSession(userID) {
//         try {
//             const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:FNhKS6jt/connect-create_account_session?user_id=${userID}`, {
//                 method: 'POST', // Assuming it's still a POST request
//                 headers: {
//                     'Content-Type': 'application/json'
//                 }
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! Status: ${response.status}`);
//             }

//             const data = await response.json();
//             return data.result1.response.result.client_secret; // Assuming the response contains a client_secret field
//         } catch (error) {
//         }
//     }
// });

