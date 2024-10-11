document.addEventListener('DOMContentLoaded', () => {
    window.Wized = window.Wized || [];
    window.Wized.push(async (Wized) => {

        await Wized.requests.waitFor('Load_user');
        const userLoadStatus = Wized.data.r.Load_user.status


        document.querySelector('[data-element="addListing_Button"]').addEventListener('click', async function () {
            try {
                if (userLoadStatus === 200) {
                    // If the user is signed in, navigate to /add-home
                    window.location.href = '/add-home';
                } else {
                    // User is not signed in
                    console.log('cant find user')
                }
            } catch (error) {
                console.error('Failed to load user:', error);
            }
        });


    });
})